import pino from "pino"
import {ElementCompact} from "xml-js"
import {hl7V3} from "@models"
import {writeXmlStringCanonicalized} from "../serialisation/xml"
import {convertFragmentsToHashableFormat, extractFragments} from "../translation/request/signature"
import {createParametersDigest} from "../translation/request"
import crypto from "crypto"
import {isTruthy} from "../translation/common"
import {isSignatureCertificateAuthorityValid, isSignatureCertificateValid} from "./certificate-revocation"
import {convertHL7V3DateTimeToIsoDateTimeString, isDateInRange} from "../translation/common/dateTime"
import {HashingAlgorithm, getHashingAlgorithmFromSignatureRoot} from "../translation/common/hashingAlgorithm"
import {getSubCaCerts} from "./certificate-revocation/utils"
import {getCertificateFromPrescriptionCrypto} from "./common"

export const verifyPrescriptionSignature = async (
  parentPrescription: hl7V3.ParentPrescription,
  logger: pino.Logger
): Promise<Array<string>> => {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  const validSignatureFormat = verifySignatureHasCorrectFormat(signatureRoot)
  if (!validSignatureFormat) {
    return ["Invalid signature format"]
  }

  const hasSingleCertificate = verifySignatureHasSingleCertificate(signatureRoot)
  if (!hasSingleCertificate) {
    return ["Multiple certificates detected"]
  }

  let certificate: crypto.X509Certificate
  try {
    certificate = getCertificateFromPrescriptionCrypto(signatureRoot)
  } catch (e) {
    logger.warn(e, "Could not parse X509 certificate")
    return ["Invalid certificate"]
  }

  const errors = []
  const signedDate = extractSignatureDateTimeStamp(parentPrescription)
  const validSignature = await verifySignatureValid(signatureRoot, certificate)
  if (!validSignature) {
    errors.push("Signature is invalid")
  }

  const matchingSignature = await verifySignatureDigestMatchesPrescription(parentPrescription, signatureRoot)
  if (!matchingSignature) {
    errors.push("Signature doesn't match prescription")
  }

  const isCertificateValid = await isSignatureCertificateValid(parentPrescription, logger)
  if (!isCertificateValid) {
    errors.push("Certificate is revoked")
  }

  const isCertificateAuthorityValid = await isSignatureCertificateAuthorityValid(parentPrescription, logger)
  if (!isCertificateAuthorityValid) {
    errors.push("CA certificate is revoked")
  }

  const certificateValidWhenSigned = verifyCertificateValidWhenSigned(signedDate, certificate)
  if (!certificateValidWhenSigned) {
    errors.push("Certificate expired when signed")
  }

  const isTrusted = verifyChain(certificate)
  if (!isTrusted) {
    errors.push("Certificate not trusted")
  }

  return errors
}

function verifyChain(x509Certificate: crypto.X509Certificate): boolean {
  const subCACerts = getSubCaCerts()
  return subCACerts.some((subCa) => isCertTrusted(x509Certificate, subCa))
}

function isCertTrusted(x509Certificate: crypto.X509Certificate, subCA: string): boolean {
  const subCert = new crypto.X509Certificate(subCA)
  return x509Certificate.checkIssued(subCert)
}

function verifySignatureHasCorrectFormat(signatureRoot: ElementCompact): boolean {
  const signature = signatureRoot?.Signature
  const signedInfo = signature?.SignedInfo
  const signatureValue = signature?.SignatureValue?._text
  const x509Certificate = signature?.KeyInfo?.X509Data?.X509Certificate?._text
  return isTruthy(signedInfo) && isTruthy(signatureValue) && isTruthy(x509Certificate)
}

function verifySignatureHasSingleCertificate(signatureRoot: ElementCompact): boolean {
  const signature = signatureRoot?.Signature
  const x509Certificate: string = signature?.KeyInfo?.X509Data?.X509Certificate?._text || ""
  return (!x509Certificate.includes("BEGIN CERTIFICATE") && !x509Certificate.includes("END CERTIFICATE"))
}

async function verifySignatureDigestMatchesPrescription(
  parentPrescription: hl7V3.ParentPrescription,
  signatureRoot: ElementCompact
): Promise<boolean> {
  const digestOnSignature = await extractDigestFromSignatureRoot(signatureRoot)

  console.log( "digestOnSignature ", digestOnSignature)

  const calculatedDigest = await calculateDigestFromParentPrescription(
    parentPrescription,
    signatureRoot,
    getHashingAlgorithmFromSignatureRoot(signatureRoot)
  )

  console.log( "calculatedDigest ", calculatedDigest)
  console.log( "digestOnSignature === calculatedDigest ", digestOnSignature === calculatedDigest)

  return digestOnSignature === calculatedDigest
}

function extractSignatureRootFromParentPrescription(
  parentPrescription: hl7V3.ParentPrescription
): ElementCompact {
  const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription
  return pertinentPrescription.author.signatureText
}

function verifyCertificateValidWhenSigned(signatureDate: Date, certificate: crypto.X509Certificate): boolean {
  const certificateStartDate = new Date(certificate.validFrom)
  const certificateEndDate = new Date(certificate.validTo)
  return isDateInRange(signatureDate, certificateStartDate, certificateEndDate)
}

function extractSignatureDateTimeStamp(parentPrescriptions: hl7V3.ParentPrescription): Date {
  const author = parentPrescriptions.pertinentInformation1.pertinentPrescription.author
  return new Date(convertHL7V3DateTimeToIsoDateTimeString(author.time))
}

function extractSignatureMethodFromSignatureRoot(signatureRoot: ElementCompact) {
  const re = /(rsa-sha)\w+/g
  const signatureMethod = signatureRoot.Signature.SignedInfo.SignatureMethod._attributes.Algorithm.match(re)
  if (signatureMethod) {
    return signatureMethod[0] === "rsa-sha256" ? signatureMethod[0] : "rsa-sha1"
  } else {
    signatureRoot.Signature.SignedInfo.SignatureMethod._attributes.Algorithm =
    "http://www.w3.org/2000/09/xmldsig#rsa-sha1"
    signatureRoot.Signature.SignedInfo.Reference.DigestMethod._attributes.Algorithm =
    "http://www.w3.org/2000/09/xmldsig#sha1"
    return "rsa-sha1"
  }
}

async function extractDigestFromSignatureRoot(signatureRoot: ElementCompact): Promise<string> {
  const signature = signatureRoot.Signature
  const signedInfo = signature.SignedInfo
  signedInfo._attributes = {
    xmlns: signature._attributes.xmlns
  }
  const canonicalizationMethod = signedInfo.CanonicalizationMethod._attributes.Algorithm
  return await writeXmlStringCanonicalized({SignedInfo: signedInfo}, canonicalizationMethod)
}

async function calculateDigestFromParentPrescription(
  parentPrescription: hl7V3.ParentPrescription,
  signatureRoot: ElementCompact,
  hashingAlgorithm: HashingAlgorithm
) {
  const fragments = extractFragments(parentPrescription)
  const canonicalizationMethod = signatureRoot.Signature.SignedInfo.CanonicalizationMethod._attributes.Algorithm
  const fragmentsToBeHashed = await convertFragmentsToHashableFormat(fragments, canonicalizationMethod)
  const digestFromPrescriptionBase64 = await createParametersDigest(
    fragmentsToBeHashed,
    canonicalizationMethod,
    hashingAlgorithm
  )
  return Buffer.from(digestFromPrescriptionBase64, "base64").toString("utf-8")
}

async function verifySignatureValid(signatureRoot: ElementCompact, certificate: crypto.X509Certificate) {
  const signatureMethodSha256OrSha1 = extractSignatureMethodFromSignatureRoot(signatureRoot)
  const signatureVerifier = crypto.createVerify(signatureMethodSha256OrSha1)
  const digest = await extractDigestFromSignatureRoot(signatureRoot)

  //console.log( "verifySignatureValid - baddigest", baddigest)
  // eslint-disable-next-line max-len
  //const digest= "<SignedInfo><CanonicalizationMethod Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\"/><SignatureMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#rsa-sha1\"/><Reference><Transforms><Transform Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\"/></Transforms><DigestMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#sha1\"/><DigestValue>C0ljh8shA++0KSPIVPQfHfK8NBY=</DigestValue></Reference></SignedInfo>"

  signatureVerifier.update(digest)
  const signature = signatureRoot.Signature
  const signatureValue = signature.SignatureValue._text

  const res = signatureVerifier.verify(certificate.publicKey, signatureValue, "base64")
  return res
}
