import {ElementCompact} from "xml-js"
import {hl7V3} from "@models"
import {writeXmlStringCanonicalized} from "../serialisation/xml"
import {convertFragmentsToHashableFormat, extractFragments} from "../translation/request/signature"
import {createParametersDigest} from "../translation/request"
import crypto from "crypto"
import {isTruthy} from "../translation/common"
import {convertHL7V3DateTimeToIsoDateTimeString, isDateInRange} from "../translation/common/dateTime"
function verifySignature(parentPrescription: hl7V3.ParentPrescription): Array<string> {
  const validSignatureFormat = verifySignatureHasCorrectFormat(parentPrescription)
  if (!validSignatureFormat) {
    return ["Invalid signature format"]
  }

  const errors = []

  const validSignature = verifyPrescriptionSignatureValid(parentPrescription)
  if (!validSignature) {
    errors.push("Signature is invalid")
  }

  const matchingSignature = verifySignatureDigestMatchesPrescription(parentPrescription)
  if (!matchingSignature) {
    errors.push("Signature doesn't match prescription")
  }

  const certificateIsValid = verifyCertificate(parentPrescription)
  if (!certificateIsValid) {
    errors.push("Certificate is invalid")
  }
  const certificateValidWhenSigned = verifyCertificateValidWhenSigned(parentPrescription)
  if (!certificateValidWhenSigned) {
    errors.push("Certificate expired when signed")
  }

  return errors
}

function verifySignatureHasCorrectFormat(parentPrescription: hl7V3.ParentPrescription): boolean {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  const signature = signatureRoot?.Signature
  const signedInfo = signature?.SignedInfo
  const signatureValue = signature?.SignatureValue?._text
  const x509Certificate = signature?.KeyInfo?.X509Data?.X509Certificate?._text
  return isTruthy(signedInfo) && isTruthy(signatureValue) && isTruthy(x509Certificate)
}

function verifySignatureDigestMatchesPrescription(parentPrescription: hl7V3.ParentPrescription): boolean {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  const digestOnPrescription = extractDigestFromSignatureRoot(signatureRoot)
  const calculatedDigestFromPrescription = calculateDigestFromParentPrescription(parentPrescription)
  console.log(`Digest on Prescription: ${digestOnPrescription}`)
  console.log(`Calculated digest from Prescription: ${calculatedDigestFromPrescription}`)
  return digestOnPrescription === calculatedDigestFromPrescription
}

function verifyPrescriptionSignatureValid(parentPrescription: hl7V3.ParentPrescription): boolean {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  return verifySignatureValid(signatureRoot)
}

function extractSignatureRootFromParentPrescription(
  parentPrescription: hl7V3.ParentPrescription
): ElementCompact {
  const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription
  return pertinentPrescription.author.signatureText
}

function verifyCertificateValidWhenSigned(parentPrescription: hl7V3.ParentPrescription): boolean {
  const signatureTimeStamp = extractSignatureDateTimeStamp(parentPrescription)
  const prescriptionCertificate = getX509CertificateFromPrescription(parentPrescription)
  const signatureDate = new Date(convertHL7V3DateTimeToIsoDateTimeString(signatureTimeStamp))
  const certificateStartDate = new Date(prescriptionCertificate.validFrom)
  const certificateEndDate = new Date(prescriptionCertificate.validTo)
  return isDateInRange(signatureDate, certificateStartDate, certificateEndDate)
}

function getX509CertificateFromPrescription(parentPrescription: hl7V3.ParentPrescription): crypto.X509Certificate {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  const {Signature} = signatureRoot
  const x509CertificateText = Signature.KeyInfo.X509Data.X509Certificate._text
  const x509Certificate = `-----BEGIN CERTIFICATE-----\n${x509CertificateText}\n-----END CERTIFICATE-----`
  return new crypto.X509Certificate(x509Certificate)
}

function extractSignatureDateTimeStamp(parentPrescriptions: hl7V3.ParentPrescription): hl7V3.Timestamp {
  const author = parentPrescriptions.pertinentInformation1.pertinentPrescription.author
  return author.time
}

function extractDigestFromSignatureRoot(signatureRoot: ElementCompact) {
  const signature = signatureRoot.Signature
  const signedInfo = signature.SignedInfo
  signedInfo._attributes = {
    xmlns: signature._attributes.xmlns
  }
  return writeXmlStringCanonicalized({SignedInfo: signedInfo})
}

function calculateDigestFromParentPrescription(parentPrescription: hl7V3.ParentPrescription) {
  const fragments = extractFragments(parentPrescription)
  const fragmentsToBeHashed = convertFragmentsToHashableFormat(fragments)
  const digestFromPrescriptionBase64 = createParametersDigest(fragmentsToBeHashed)
  return Buffer.from(digestFromPrescriptionBase64, "base64").toString("utf-8")
}

function verifySignatureValid(signatureRoot: ElementCompact) {
  const signatureVerifier = crypto.createVerify("RSA-SHA1")
  const digest = extractDigestFromSignatureRoot(signatureRoot)
  signatureVerifier.update(digest)
  const signature = signatureRoot.Signature
  const signatureValue = signature.SignatureValue._text
  const x509Certificate = signature.KeyInfo.X509Data.X509Certificate._text
  const x509CertificatePem = `-----BEGIN CERTIFICATE-----\n${x509Certificate}\n-----END CERTIFICATE-----`
  return signatureVerifier.verify(x509CertificatePem, signatureValue, "base64")
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function verifyCertificate(parentPrescription: hl7V3.ParentPrescription): boolean {
  // TODO: Add certificate verification
  console.log("Skipping certificate verification...")
  return true
}

export {
  extractSignatureRootFromParentPrescription,
  verifySignatureDigestMatchesPrescription,
  verifyPrescriptionSignatureValid,
  verifySignatureHasCorrectFormat,
  verifyCertificate,
  verifySignature,
  extractSignatureDateTimeStamp,
  verifyCertificateValidWhenSigned
}
