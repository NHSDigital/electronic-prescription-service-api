import axios from "axios"
import {X509, Hex} from "jsrsasign"
import pino, {Logger} from "pino"
import {hl7V3} from "@models"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../../translation/common/dateTime"
import {
  extractSignatureDateTimeStamp,
  extractSignatureRootFromParentPrescription,
  getCertificateFromPrescriptionCrypto
} from "../common"
import {X509CrlEntry, X509Crl} from "@peculiar/x509"

const CRL_REQUEST_TIMEOUT_IN_MS = 10000

const getRevokedCertSerialNumber = (cert: X509CrlEntry) => {
  const certHexValue = cert.serialNumber
  return certHexValue.toLocaleLowerCase()
}

const getPrescriptionSignatureDate = (parentPrescription: hl7V3.ParentPrescription): Date => {
  const prescriptionSignedDateTimestamp = extractSignatureDateTimeStamp(parentPrescription)
  return new Date(convertHL7V3DateTimeToIsoDateTimeString(prescriptionSignedDateTimestamp))
}

const getCertificateFromPrescription = (parentPrescription: hl7V3.ParentPrescription, logger: Logger): X509 => {
  try {
    const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
    const certificate = getCertificateFromPrescriptionCrypto(signatureRoot)
    const x509Certificate = new X509(certificate.toString())
    return x509Certificate
  } catch (e) {
    logger.error(e)
    return null
  }
}

const wasPrescriptionSignedAfterRevocation = (prescriptionSignedDate: Date, cert: X509CrlEntry): boolean => {
  const certificateRevocationDate = cert.revocationDate
  return prescriptionSignedDate >= certificateRevocationDate
}

const getRevocationList = async (crlFileUrl: string, logger: pino.Logger): Promise<X509Crl> => {
  try {
    const resp = await axios(crlFileUrl, {
      method: "GET",
      responseType: "arraybuffer",
      // Manually set timeout to avoid waiting indefinitely, which would make the original request fail as well
      timeout: CRL_REQUEST_TIMEOUT_IN_MS
    })
    return new X509Crl(resp.data)
  } catch(e) {
    logger.error(`Unable to fetch CRL from ${crlFileUrl}: ${e}`)
  }
}

const getPrescriptionId = (parentPrescription: hl7V3.ParentPrescription): string => {
  return parentPrescription.id._attributes.root
}

const getRevokedCertReasonCode = (cert: X509CrlEntry): number => {
  return cert.reason
}

/**
 * returns the serial number of an X509 certificate
 * separated into standalone function for mocking in unit tests
 * @param x509Certificate
 * @returns serial number string
 */
const getX509SerialNumber = (x509Certificate: X509): string => {
  return x509Certificate?.getSerialNumberHex()
}

const getX509DistributionPointsURI = (x509Certificate: X509): Array<string> => {
  return x509Certificate.getExtCRLDistributionPointsURI()
}

const getX509IssuerId = (x509Certificate: X509): Hex => {
  return x509Certificate.getExtAuthorityKeyIdentifier().kid
}

const getSubCaCerts = (): Array<string> => {
  return process.env.SUBCACC_CERT ? process.env.SUBCACC_CERT.split(",") : []
}

export {
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
}
