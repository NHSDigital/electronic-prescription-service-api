import pino from "pino"
import {RevokedCertificate} from "pkijs"
import {CRLReasonCode} from "./crl-reason-code"
import {hl7V3} from "@models"
import {
  getCertificateFromPrescription,
  getPrescriptionSignatureDate,
  getRevocationList,
  getRevokedCertReasonCode,
  getRevokedCertSerialNumber,
  getX509SerialNumber,
  wasPrescriptionSignedAfterRevocation
} from "./utils"

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
      const isFailed = wasPrescriptionSignedAfterRevocation(prescriptionSignedDate, cert)
      if (isFailed) logger.warn(`${errorMsgPrefix} with Reason Code ${reasonCode}`)
      return isFailed

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

const isSignatureCertificateValid = async (
  parentPrescription: hl7V3.ParentPrescription,
  logger: pino.Logger
): Promise<boolean> => {
  const x509Certificate = getCertificateFromPrescription(parentPrescription)
  const serialNumber = getX509SerialNumber(x509Certificate)
  const prescriptionSignedDate = getPrescriptionSignatureDate(parentPrescription)

  // TODO: Check function, might be deprecated
  const distributionPointsURI = x509Certificate.getExtCRLDistributionPointsURI()
  if (!distributionPointsURI || distributionPointsURI.length === 0) {
    logger.error(`Cannot retrieve CRL distribution point from certificate with serial ${serialNumber}`)
    return true // TODO: Add decision log number with justification
  }

  // Loop through the Distribution Points found on the cert
  for (const distributionPointURI of distributionPointsURI) {
    const crl = await getRevocationList(distributionPointURI)
    if (!crl) {
      logger.error(`Cannot retrieve CRL from certificate with serial ${serialNumber}`)
      return true // TODO: Add decision log number with justification
    }

    // Loop through the revoked certs on the CRL
    for (const revokedCertificate of crl.revokedCertificates) {
      const revokedCertificateSerialNumber = getRevokedCertSerialNumber(revokedCertificate)

      const foundMatchingCertificate = serialNumber === revokedCertificateSerialNumber
      if (foundMatchingCertificate) {
        return !isCertificateRevoked(revokedCertificate, prescriptionSignedDate, logger)
      }
    }
  }

  return true
}

export {
  isCertificateRevoked,
  isSignatureCertificateValid
}
