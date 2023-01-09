import axios from "axios"
import pino from "pino"
import {X509} from "jsrsasign"
import {CertificateRevocationList, RevokedCertificate} from "pkijs"
import {fromBER} from "asn1js"
import {bufferToHexCodes} from "pvutils"
import {CRLReasonCode} from "./crl-reason-code"
import {hl7V3} from "@models"
import {ElementCompact} from "xml-js"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../../../services/translation/common/dateTime"

const CRL_REASON_CODE_EXTENSION = "2.5.29.21"

const getRevokedCertSerialNumber = (cert: RevokedCertificate): string => {
  const certHexValue = cert.userCertificate.valueBlock.valueHexView
  return bufferToHexCodes(certHexValue).toLocaleLowerCase()
}

const getRevokedCertReasonCode = (cert: RevokedCertificate): number => {
  const crlExtension = cert.crlEntryExtensions?.extensions.find(ext => ext.extnID === CRL_REASON_CODE_EXTENSION)
  return crlExtension ? parseInt(crlExtension.parsedValue.valueBlock) : null
}

// TODO: move to common file
function extractSignatureRootFromParentPrescription(
  parentPrescription: hl7V3.ParentPrescription
): ElementCompact {
  const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription
  return pertinentPrescription.author.signatureText
}

// TODO: move to common file
function extractSignatureDateTimeStamp(parentPrescriptions: hl7V3.ParentPrescription): hl7V3.Timestamp {
  const author = parentPrescriptions.pertinentInformation1.pertinentPrescription.author
  return author.time
}

const getPrescriptionSignatureDate = (parentPrescription: hl7V3.ParentPrescription): Date => {
  const prescriptionSignedDateTimestamp = extractSignatureDateTimeStamp(parentPrescription)
  return new Date(convertHL7V3DateTimeToIsoDateTimeString(prescriptionSignedDateTimestamp))
}

const getCertificateFromPrescription = (parentPrescription: hl7V3.ParentPrescription): X509 => {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  const signature = signatureRoot?.Signature
  const x509CertificateText = signature?.KeyInfo?.X509Data?.X509Certificate?._text
  const x509CertificatePem = `-----BEGIN CERTIFICATE-----\n${x509CertificateText}\n-----END CERTIFICATE-----`
  const x509Certificate = new X509(x509CertificatePem)
  return x509Certificate
}

const wasPrescriptionSignedAfterRevocation = (prescriptionSignedDate: Date, cert: RevokedCertificate) => {
  const certificateRevocationDate = new Date(cert.revocationDate.value)
  return prescriptionSignedDate >= certificateRevocationDate
}

/**
 * AEA-2650 - Checks whether a certificate has been revoked by verifying it is not found
 * on the Certificate Revocation List (CRL) specified on the certificate.
 *
 * AC 1.1:
 * Whenever a signature, for any given prescription, is created **after** the revocation date
 * of its certificate, and the CRL Reason Code is one of the following,
 * the prescription shall be deemed to be invalid.
 *
 * AC 1.2:
 * Whenever a signature, for any given prescription, is created with a certificate
 * that appears on the CRL and the CRL Reason Code is one of the following,
 * the prescription shall be always deemed invalid.
 *
 * @param cert the matching certificate found on the CRL
 * @param prescriptionSignedDate the date the prescription was signed
 * @param logger the logger instance used to write log messages
 * @returns true if the certificate is considered revoked, false otherwise
 */
const isCertificateRevoked = (
  cert: RevokedCertificate,
  prescriptionSignedDate: Date,
  logger: pino.Logger
): boolean => {
  const certSerialNumber = getRevokedCertSerialNumber(cert)
  const reasonCode = getRevokedCertReasonCode(cert)

  if (!reasonCode) {
    logger.error(`Cannot extract Reason Code from CRL for certificate with serial ${certSerialNumber}`)
    return false
  }

  const errorMsgPrefix = `Certificate with serial '${certSerialNumber}' found on CRL with`

  switch (reasonCode) {
    // AEA-2650 - AC 1.1
    case CRLReasonCode.Unspecified:
    case CRLReasonCode.AffiliationChanged:
    case CRLReasonCode.Superseded:
    case CRLReasonCode.CessationOfOperation:
    case CRLReasonCode.CertificateHold:
    case CRLReasonCode.RemoveFromCRL:
      // eslint-disable-next-line no-case-declarations
      const failed = wasPrescriptionSignedAfterRevocation(prescriptionSignedDate, cert)
      if (failed) logger.warn(`${errorMsgPrefix} with Reason Code ${reasonCode}`)
      return failed

    // AEA-2650 - AC 1.2
    case CRLReasonCode.KeyCompromise:
    case CRLReasonCode.CACompromise:
      logger.warn(`${errorMsgPrefix} with Reason Code ${reasonCode}`)
      return true // TODO: Add decision log number with justification

    default:
      logger.error(`${errorMsgPrefix} with unhandled Reason Code ${reasonCode}`)
      return false
  }
}

const getRevocationList = async (crlFileUrl: string): Promise<CertificateRevocationList> => {
  const resp = await axios(crlFileUrl, {method: "GET", responseType: "arraybuffer"})
  if (resp.status === 200) {
    const asn1crl = fromBER(resp.data)
    return new CertificateRevocationList({schema: asn1crl.result})
  }
}

export const isSignatureCertificateValid = async (
  parentPrescription: hl7V3.ParentPrescription,
  logger: pino.Logger
): Promise<boolean> => {
  const x509Certificate = getCertificateFromPrescription(parentPrescription)
  const serialNumber = x509Certificate.getSerialNumberHex()
  const prescriptionSignedDate = getPrescriptionSignatureDate(parentPrescription)

  // TODO: Check function, might be deprecated
  const distributionPointsURI = x509Certificate.getExtCRLDistributionPointsURI()
  if (!distributionPointsURI) {
    logger.error(`Cannot retrieve CRL distribution point from certificate with serial ${serialNumber}`)
    return true // TODO: Add decision log number with justification
  }

  // Loop through the Distribution Points found on the cert
  for (const distributionPointURI in distributionPointsURI) {
    const crl = await getRevocationList(distributionPointURI)
    if (!crl) {
      logger.error(`Cannot retrieve CRL from certificate with serial ${serialNumber}`)
      return true // TODO: Add decision log number with justification
    }

    // Loop through the revoked certs on the CRL
    crl.revokedCertificates.forEach((revokedCertificate: RevokedCertificate) => {
      const revokedCertificateSerialNumber = getRevokedCertSerialNumber(revokedCertificate)

      const foundMatchingCertificate = serialNumber === revokedCertificateSerialNumber
      if (foundMatchingCertificate) {
        return !isCertificateRevoked(revokedCertificate, prescriptionSignedDate, logger)
      }
    })
  }

  return true
}
