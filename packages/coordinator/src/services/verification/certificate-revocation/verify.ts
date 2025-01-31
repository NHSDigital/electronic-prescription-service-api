import pino from "pino"
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
  getX509IssuerId,
  getX509SerialNumber,
  wasPrescriptionSignedAfterRevocation
} from "./utils"
import {X509CrlEntry} from "@peculiar/x509"
import {isEpsHostedContainer} from "../../../utils/feature-flags"

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
  cert: X509CrlEntry,
  prescriptionSignedDate: Date,
  logger: pino.Logger
): boolean => {
  const certSerialNumber = getRevokedCertSerialNumber(cert)
  const signedAfterRevocation = wasPrescriptionSignedAfterRevocation(prescriptionSignedDate, cert)
  const errorMsgPrefix = `Certificate with serial '${certSerialNumber}' found on CRL`

  const reasonCode = getRevokedCertReasonCode(cert)
  if (!reasonCode) {
    logger.error(`Cannot extract Reason Code from CRL for certificate with serial ${certSerialNumber}`)
    return signedAfterRevocation
  }
  switch (reasonCode) {
    case CRLReasonCode.Unspecified:
    case CRLReasonCode.AffiliationChanged:
    case CRLReasonCode.Superseded:
    case CRLReasonCode.CessationOfOperation:
    case CRLReasonCode.CertificateHold:
    case CRLReasonCode.RemoveFromCRL:
      if (signedAfterRevocation) logger.warn(`${errorMsgPrefix} with Reason Code ${reasonCode}`)
      return signedAfterRevocation

    case CRLReasonCode.KeyCompromise:
    case CRLReasonCode.CACompromise:
    case CRLReasonCode.AACompromise:
      logger.warn(`${errorMsgPrefix} with Reason Code ${reasonCode}`)
      return true

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

const getSubCaCert = (certificate: X509, serialNumber: string, logger: pino.Logger): X509 => {
  const subCaCerts = getSubCaCerts().map(c => new X509(c))

  const caIssuerCertSerial = getX509IssuerId(certificate)
  if (!caIssuerCertSerial) {
    logger.error(`Cannot retrieve CA issuer cert serial from certificate with serial ${serialNumber}.`)
    return undefined
  }

  const filteredSubCaCerts = subCaCerts.filter(
    c => {
      try {
        return c.getExtSubjectKeyIdentifier().kid.hex === caIssuerCertSerial.hex
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        logger.error(
          `Error getting SubjectKeyIdentifier from certificate with serial ${getX509SerialNumber(c)}`
        )
        return false
      }
    }
  )

  return filteredSubCaCerts.length > 0 ? filteredSubCaCerts[0] : undefined
}

const isSignatureCertificateAuthorityValid = async (
  parentPrescription: hl7V3.ParentPrescription,
  logger: pino.Logger
): Promise<boolean> => {
  const {certificate, serialNumber} = parseCertificateFromPrescription(parentPrescription)
  const subCaCert = getSubCaCert(certificate, serialNumber, logger)
  if (!subCaCert) {
    logger.error(
      `No sub-CA certs matching that of the prescription. Skipping ARL check. Certificate serial ${serialNumber}.`
    )
    return true
  }
  const subCaCertSerial = getX509SerialNumber(subCaCert)

  const prescriptionSignedDate = getPrescriptionSignatureDate(parentPrescription)
  const prescriptionId = getPrescriptionId(parentPrescription)

  return await checkForRevocation(
    subCaCert,
    subCaCertSerial,
    prescriptionSignedDate,
    prescriptionId,
    logger
  )
}

const isSignatureCertificateValid = async (
  parentPrescription: hl7V3.ParentPrescription,
  logger: pino.Logger
): Promise<boolean> => {
  const {certificate, serialNumber} = parseCertificateFromPrescription(parentPrescription)
  const prescriptionSignedDate = getPrescriptionSignatureDate(parentPrescription)
  const prescriptionId = getPrescriptionId(parentPrescription)

  if (!certificate) {
    logger.error(`Could not parse X509 certificate from prescription with ID '${prescriptionId}'`)
    return false
  }

  return await checkForRevocation(
    certificate,
    serialNumber,
    prescriptionSignedDate,
    prescriptionId,
    logger
  )
}

const checkForRevocation = async (
  certificate: X509,
  serialNumber: string,
  prescriptionSignedDate: Date,
  prescriptionId: string,
  logger: pino.Logger
) => {
  const distributionPointsURI = getX509DistributionPointsURI(certificate)
  if (!distributionPointsURI || distributionPointsURI.length === 0) {
    logger.error(`Cannot retrieve CRL distribution point from certificate with serial ${serialNumber}`)
    return true
  }

  for (const distributionPointURI of distributionPointsURI) {
    let proxiedDistributionPointURI = distributionPointURI
    if (!isEpsHostedContainer()) {
      proxiedDistributionPointURI = distributionPointURI.replace(
        "http://" + CRL_DISTRIBUTION_DOMAIN,
        "https://" + CRL_DISTRIBUTION_PROXY)
    }
    const crl = await getRevocationList(proxiedDistributionPointURI, logger)
    if (!crl) {
      logger.error(`Cannot retrieve CRL from certificate with serial ${serialNumber}`)
      return true
    }

    if(crl.entries){
      for (const revokedCertificate of crl.entries) {
        const revokedCertificateSerialNumber = getRevokedCertSerialNumber(revokedCertificate)

        const foundMatchingCertificate = serialNumber === revokedCertificateSerialNumber
        if (foundMatchingCertificate) {
          return checkCertificateValidity(
            revokedCertificate,
            serialNumber,
            prescriptionSignedDate,
            prescriptionId,
            logger
          )
        }

      }
    }else{
      logger.info(`No revokedCertificates found on CRL at ${distributionPointURI}`)
    }
  }

  logger.info(`Valid signature found for prescription ${prescriptionId} signed by cert ${serialNumber}`)
  return true
}

function checkCertificateValidity(
  revokedCertificate: X509CrlEntry,
  serialNumber: string,
  prescriptionSignedDate: Date,
  prescriptionId: string,
  logger: pino.Logger
) {
  const isValid = !isCertificateRevoked(revokedCertificate, prescriptionSignedDate, logger)

  if (isValid) {
    let msg = `Certificate with serial ${serialNumber} found on CRL, but `
    msg += `prescription ${prescriptionId} was signed before its revocation`
    logger.info(msg)
  }

  return isValid
}

export {
  getSubCaCert,
  isSignatureCertificateAuthorityValid,
  isSignatureCertificateValid,
  parseCertificateFromPrescription
}
