import pino from "pino"
import {RevokedCertificate} from "pkijs"
import {X509} from "jsrsasign"
import {hl7V3} from "@models"
import {CRLReasonCode} from "./crl-reason-code"
import {
  getCertificateFromPrescription,
  getPrescriptionId,
  getPrescriptionSignatureDate,
  getRevocationList,
  getRevokedCertReasonCode,
  getRevokedCertSerialNumber,
  getSubCaCerts,
  getX509DistributionPointsURI,
  getX509IssuerCertSerial,
  getX509SerialNumber,
  wasPrescriptionSignedAfterRevocation
} from "./utils"

const CRL_DISTRIBUTION_DOMAIN = process.env.CRL_DISTRIBUTION_DOMAIN
const CRL_DISTRIBUTION_PROXY = process.env.CRL_DISTRIBUTION_PROXY

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
  const signedAfterRevocation = wasPrescriptionSignedAfterRevocation(prescriptionSignedDate, cert)
  const errorMsgPrefix = `Certificate with serial '${certSerialNumber}' found on CRL`

  const reasonCode = getRevokedCertReasonCode(cert)
  if (!reasonCode) {
    logger.error(`Cannot extract Reason Code from CRL for certificate with serial ${certSerialNumber}`)
    return signedAfterRevocation // prescription invalid if signed after revocation
  }

  switch (reasonCode) {
    // AEA-2650 - AC 1.1
    case CRLReasonCode.Unspecified:
    case CRLReasonCode.AffiliationChanged:
    case CRLReasonCode.Superseded:
    case CRLReasonCode.CessationOfOperation:
    case CRLReasonCode.CertificateHold:
    case CRLReasonCode.RemoveFromCRL:
      if (signedAfterRevocation) logger.warn(`${errorMsgPrefix} with Reason Code ${reasonCode}`)
      return signedAfterRevocation

    // AEA-2650 - AC 1.2 + comments about AACompromise
    case CRLReasonCode.KeyCompromise:
    case CRLReasonCode.CACompromise:
    case CRLReasonCode.AACompromise:
      logger.warn(`${errorMsgPrefix} with Reason Code ${reasonCode}`)
      return true // always consider prescription invalid

    default:
      if (signedAfterRevocation) logger.warn(`${errorMsgPrefix} with unhandled Reason Code ${reasonCode}`)
      return signedAfterRevocation
  }
}

type CertData = {
  certificate: X509,
  serialNumber: string
}

const parseCertificateFromPrescription = (parentPrescription: hl7V3.ParentPrescription): CertData => {
  const certificate = getCertificateFromPrescription(parentPrescription)
  const serialNumber = getX509SerialNumber(certificate)
  return {certificate, serialNumber}
}

const getFilteredSubCaCerts = (certificate: X509, serialNumber: string, logger: pino.Logger): Array<X509> => {
  const subCaCerts = getSubCaCerts().map(c => new X509(c))

  const caIssuerCertSerial = getX509IssuerCertSerial(certificate)
  if (!caIssuerCertSerial) {
    logger.error(`Cannot retrieve CA issuer cert serial from certificate with serial ${serialNumber}.`)
    return subCaCerts
  }

  const filteredSubCaCerts = subCaCerts.filter(c => c.getSerialNumberHex() === caIssuerCertSerial.hex)
  return filteredSubCaCerts ? filteredSubCaCerts : subCaCerts
}

const isSignatureCertificateValid = async (
  parentPrescription: hl7V3.ParentPrescription,
  logger: pino.Logger
): Promise<boolean> => {
  const prescriptionSignedDate = getPrescriptionSignatureDate(parentPrescription)
  const prescriptionId = getPrescriptionId(parentPrescription)
  const {certificate, serialNumber} = parseCertificateFromPrescription(parentPrescription)

  if (!certificate) {
    logger.error(`Could not parse X509 certificate from prescription with ID '${prescriptionId}'`)
    return false
  }

  const distributionPointsURI = getX509DistributionPointsURI(certificate)
  if (!distributionPointsURI || distributionPointsURI.length === 0) {
    logger.error(`Cannot retrieve CRL distribution point from certificate with serial ${serialNumber}`)
    return true // TODO: Add decision log number with justification
  }

  // Loop through the Distribution Points found on the cert
  for (const distributionPointURI of distributionPointsURI) {
    const proxiedDistributionPointURI = distributionPointURI.replace(
      "http://" + CRL_DISTRIBUTION_DOMAIN,
      "https://" + CRL_DISTRIBUTION_PROXY)
    const crl = await getRevocationList(proxiedDistributionPointURI, logger)
    if (!crl) {
      logger.error(`Cannot retrieve CRL from certificate with serial ${serialNumber}`)
      return true // TODO: Add decision log number with justification
    }

    // Loop through the revoked certs on the CRL
    for (const revokedCertificate of crl.revokedCertificates) {
      const revokedCertificateSerialNumber = getRevokedCertSerialNumber(revokedCertificate)

      const foundMatchingCertificate = serialNumber === revokedCertificateSerialNumber
      if (foundMatchingCertificate) {
        const isValid = !isCertificateRevoked(revokedCertificate, prescriptionSignedDate, logger)

        // Log positive outcome
        if (isValid) {
          let msg = `Certificate with serial ${serialNumber} found on CRL, but `
          msg += `prescription ${prescriptionId} was signed before its revocation`
          logger.info(msg)
        }

        return isValid
      }
    }
  }

  const subCaCerts = getFilteredSubCaCerts(certificate, serialNumber, logger)
  if (!subCaCerts) {
    logger.error(`No sub-CA certs available to check against ARL. Certificate serial ${serialNumber}.`)
    return false
  }

  logger.info(`Valid signature found for prescription ${prescriptionId} signed by cert ${serialNumber}`)
  return true
}

export {
  isSignatureCertificateValid
}
