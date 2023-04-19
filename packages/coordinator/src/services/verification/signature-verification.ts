import pino from "pino"
import {ElementCompact} from "xml-js"
import {hl7V3} from "@models"
import {writeXmlStringCanonicalized} from "../serialisation/xml"
import {convertFragmentsToHashableFormat, extractFragments} from "../translation/request/signature"
import {createParametersDigest} from "../translation/request"
import crypto from "crypto"
import {isTruthy} from "../translation/common"
import {isSignatureCertificateValid} from "./certificate-revocation"
import {convertHL7V3DateTimeToIsoDateTimeString, isDateInRange} from "../translation/common/dateTime"

export const verifyPrescriptionSignature = async (
  parentPrescription: hl7V3.ParentPrescription,
  logger: pino.Logger
): Promise<Array<string>> => {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  const validSignatureFormat = verifySignatureHasCorrectFormat(signatureRoot)
  if (!validSignatureFormat) {
    return ["Invalid signature format"]
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
  const validSignature = verifySignatureValid(signatureRoot, certificate)
  if (!validSignature) {
    errors.push("Signature is invalid")
  }

  const matchingSignature = verifySignatureDigestMatchesPrescription(parentPrescription, signatureRoot)
  if (!matchingSignature) {
    errors.push("Signature doesn't match prescription")
  }

  const isCertificateValid = await isSignatureCertificateValid(parentPrescription, logger)
  if (!isCertificateValid) {
    errors.push("Certificate is revoked")
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

const getSubCaCerts = (): Array<string> => process.env.SUBCACC_CERT.split(",")

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

function verifySignatureDigestMatchesPrescription(
  parentPrescription: hl7V3.ParentPrescription,
  signatureRoot: ElementCompact
): boolean {
  const useSHA256 =
    signatureRoot.Signature.SignedInfo.SignatureMethod._attributes.algorithm ===
    "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"
  const digestOnSignature = extractDigestFromSignatureRoot(signatureRoot)
  const calculatedDigestFromPrescription = calculateDigestFromParentPrescription(parentPrescription, useSHA256)
  return digestOnSignature === calculatedDigestFromPrescription
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

function getCertificateFromPrescriptionCrypto(signatureRoot: ElementCompact): crypto.X509Certificate {
  const x509CertificateText = signatureRoot.Signature.KeyInfo.X509Data.X509Certificate._text
  const x509Certificate = `-----BEGIN CERTIFICATE-----\n${x509CertificateText}\n-----END CERTIFICATE-----`
  return new crypto.X509Certificate(x509Certificate)
}

function extractSignatureDateTimeStamp(parentPrescriptions: hl7V3.ParentPrescription): Date {
  const author = parentPrescriptions.pertinentInformation1.pertinentPrescription.author
  return new Date(convertHL7V3DateTimeToIsoDateTimeString(author.time))
}

function extractDigestFromSignatureRoot(signatureRoot: ElementCompact) {
  const signature = signatureRoot.Signature
  const signedInfo = signature.SignedInfo
  signedInfo._attributes = {
    xmlns: signature._attributes.xmlns
  }
  return writeXmlStringCanonicalized({SignedInfo: signedInfo})
}

function calculateDigestFromParentPrescription(parentPrescription: hl7V3.ParentPrescription, useSHA256?: boolean) {
  const fragments = extractFragments(parentPrescription)
  const fragmentsToBeHashed = convertFragmentsToHashableFormat(fragments)
  const digestFromPrescriptionBase64 = createParametersDigest(fragmentsToBeHashed, useSHA256)
  return Buffer.from(digestFromPrescriptionBase64, "base64").toString("utf-8")
}

function verifySignatureValid(signatureRoot: ElementCompact, certificate: crypto.X509Certificate) {
  const signatureVerifier = crypto.createVerify("RSA-SHA1")
  const digest = extractDigestFromSignatureRoot(signatureRoot)
  signatureVerifier.update(digest)
  const signature = signatureRoot.Signature
  const signatureValue = signature.SignatureValue._text
  return signatureVerifier.verify(certificate.publicKey, signatureValue, "base64")
}
