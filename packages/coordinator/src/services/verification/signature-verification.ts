import {ElementCompact} from "xml-js"
import {hl7V3} from "@models"
import {writeXmlStringCanonicalized} from "../serialisation/xml"
import {convertFragmentsToHashableFormat, extractFragments} from "../translation/request/signature"
import {createParametersDigest} from "../translation/request"
import crypto from "crypto"
import {isTruthy} from "../translation/common"
import {X509} from "jsrsasign"
import {CertificateRevocationList, RevokedCertificate} from "pkijs"
import {fromBER} from "asn1js"
import {bufferToHexCodes} from "pvutils"
import axios from "axios"
import {convertHL7V3DateTimeToIsoDateTimeString, isDateInRange} from "../translation/common/dateTime"

enum CRLReasonCode {
  Unspecified = 0,
  AffiliationChanged = 3,
  Superseded = 4,
  CessationOfOperation = 5,
  CertificateHold = 6,
  RemoveFromCRL = 8,
}

function verifyPrescriptionSignature(parentPrescription: hl7V3.ParentPrescription): Array<string> {
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

  const certificatedNotRevoked = verifyCertificateRevoked(parentPrescription)
  if (!certificatedNotRevoked) {
    errors.push("Certificate is revoked")
  }

  const verifyCertificateErrors = verifyCertificate(parentPrescription)
  if (verifyCertificateErrors.length > 0) {
    errors.push(...verifyCertificateErrors)
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
  const prescriptionCertificate = getCertificateFromPrescriptionCrypto(parentPrescription)
  const signatureDate = new Date(convertHL7V3DateTimeToIsoDateTimeString(signatureTimeStamp))
  const certificateStartDate = new Date(prescriptionCertificate.validFrom)
  const certificateEndDate = new Date(prescriptionCertificate.validTo)
  return isDateInRange(signatureDate, certificateStartDate, certificateEndDate)
}

async function verifyCertificateRevoked(parentPrescription: hl7V3.ParentPrescription): Promise<boolean> {
  const prescriptionDate = new Date(convertHL7V3DateTimeToIsoDateTimeString(parentPrescription.effectiveTime))
  const x509Certificate = getCertificateFromPrescriptionJrsasign(parentPrescription)
  const serialNumber = x509Certificate.getSerialNumberHex()
  const distributionPointsURI = x509Certificate.getExtCRLDistributionPointsURI()
  if (distributionPointsURI) {
    for (let index = 0; index < distributionPointsURI.length; index++) {
      const crl = await getRevocationList(distributionPointsURI[index])
      if (crl) {
        const isRevoked = revocationListContainsCert(crl, prescriptionDate, serialNumber)
        if (isRevoked)
          return true
      }
    }
  }
  return false
}

async function getRevocationList(crlFileUrl: string): Promise<CertificateRevocationList> {
  let crl: CertificateRevocationList
  const resp = await axios(crlFileUrl, {method: "GET", responseType: "arraybuffer"})
  if (resp.status === 200) {
    const asn1crl = fromBER(resp.data)
    crl = new CertificateRevocationList({schema: asn1crl.result})
  }
  return crl
}

function revocationListContainsCert(crl: CertificateRevocationList, dateCreated: Date, serialNumber: string): boolean {
  let isCertificateRevoked = false
  crl.revokedCertificates.map(revokedCertificate => {
    const dateRevoked = new Date(revokedCertificate.revocationDate.value)
    const revokedCertificateSn = getSerialNumberFroRevokedCert(revokedCertificate)
    if (crl.crlExtensions?.extensions) {
      const crlExtension = revokedCertificate.crlEntryExtensions?.extensions.find(ext => ext.extnID === "2.5.29.21")
      if (crlExtension) {
        const reasonCode = parseInt(crlExtension.parsedValue.valueBlock)
        const isReasonCodeRecognised = reasonCode in CRLReasonCode
        const isRevokedBeforeCreation = dateRevoked < dateCreated
        const hasMatchingSerial = serialNumber === revokedCertificateSn
        isCertificateRevoked = isReasonCodeRecognised && isRevokedBeforeCreation && hasMatchingSerial
      }
    }
  })
  return isCertificateRevoked
}

function getSerialNumberFroRevokedCert(revokedCertificate: RevokedCertificate): string {
  const certHexValue = revokedCertificate.userCertificate.valueBlock.valueHexView
  return bufferToHexCodes(certHexValue).toLocaleLowerCase()
}

function getCertificateFromPrescriptionJrsasign(parentPrescription: hl7V3.ParentPrescription): X509 {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  const signature = signatureRoot?.Signature
  const x509CertificateText = signature?.KeyInfo?.X509Data?.X509Certificate?._text
  const x509CertificatePem = `-----BEGIN CERTIFICATE-----\n${x509CertificateText}\n-----END CERTIFICATE-----`
  const x509Certificate = new X509(x509CertificatePem)
  return x509Certificate
}

function getCertificateFromPrescriptionCrypto(parentPrescription: hl7V3.ParentPrescription): crypto.X509Certificate {
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

function verifyCertificate(parentPrescription: hl7V3.ParentPrescription): Array<string> {
  const errors = []
  const certificateValidWhenSigned = verifyCertificateValidWhenSigned(parentPrescription)
  if (!certificateValidWhenSigned) {
    errors.push("Certificate expired when signed")
  }
  return errors
}

export {
  extractSignatureRootFromParentPrescription,
  verifySignatureDigestMatchesPrescription,
  verifyPrescriptionSignatureValid,
  verifySignatureHasCorrectFormat,
  verifyCertificate,
  verifyPrescriptionSignature,
  extractSignatureDateTimeStamp,
  verifyCertificateValidWhenSigned,
  getRevocationList,
  verifyCertificateRevoked,
  revocationListContainsCert
}
