import {fromBER} from "asn1js"
import axios from "axios"
import {X509} from "jsrsasign"
import pino from "pino"
import {CertificateRevocationList, RevokedCertificate} from "pkijs"
import {bufferToHexCodes} from "pvutils"
import {hl7V3} from "@models"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../../translation/common/dateTime"
import {extractSignatureDateTimeStamp, getCertificateTextFromPrescription} from "../common"
import {X509CrlEntry} from "@peculiar/x509"

//const CRL_REASON_CODE_EXTENSION = "2.5.29.21"
const CRL_REASON_CODE_EXTENSION = "2.5.29.21"
const CRL_REQUEST_TIMEOUT_IN_MS = 10000

const getRevokedCertSerialNumber = (cert: RevokedCertificate): string => {
  const certHexValue = cert.userCertificate.valueBlock.valueHexView
  return bufferToHexCodes(certHexValue).toLocaleLowerCase()
}

// const newGetRevokedCertSerialNumber = (cert: X509CrlEntry): string => {
//   const
// }

const getPrescriptionSignatureDate = (parentPrescription: hl7V3.ParentPrescription): Date => {
  const prescriptionSignedDateTimestamp = extractSignatureDateTimeStamp(parentPrescription)
  return new Date(convertHL7V3DateTimeToIsoDateTimeString(prescriptionSignedDateTimestamp))
}

const getCertificateFromPrescription = (parentPrescription: hl7V3.ParentPrescription): X509 => {
  try {
    const x509CertificateText = getCertificateTextFromPrescription(parentPrescription)
    const x509CertificatePem = `-----BEGIN CERTIFICATE-----\n${x509CertificateText}\n-----END CERTIFICATE-----`
    const x509Certificate = new X509(x509CertificatePem)
    return x509Certificate
  } catch (e) {
    return null
  }
}

const wasPrescriptionSignedAfterRevocation = (prescriptionSignedDate: Date, cert: RevokedCertificate): boolean => {
  const certificateRevocationDate = new Date(cert.revocationDate.value)
  return prescriptionSignedDate >= certificateRevocationDate
}

const getRevocationList = async (crlFileUrl: string, logger: pino.Logger): Promise<CertificateRevocationList> => {
  try {
    const resp = await axios(crlFileUrl, {
      method: "GET",
      responseType: "arraybuffer",
      // Manually set timeout to avoid waiting indefinitely, which would make the original request fail as well
      timeout: CRL_REQUEST_TIMEOUT_IN_MS
    })
    const asn1crl = fromBER(resp.data)
    return new CertificateRevocationList({schema: asn1crl.result})
  } catch(e) {
    logger.error(`Unable to fetch CRL from ${crlFileUrl}: ${e}`)
  }
}

const getPrescriptionId = (parentPrescription: hl7V3.ParentPrescription): string => {
  return parentPrescription.id._attributes.root
}

const getRevokedCertReasonCode = (cert: RevokedCertificate): number => {
  const crlExtension = cert.crlEntryExtensions?.extensions.find(ext => ext.extnID === CRL_REASON_CODE_EXTENSION)
  return crlExtension ? parseInt(crlExtension.parsedValue.valueBlock) : null
}

const newGetRevokedCertReasonCode = (cert: X509CrlEntry): number => {
  const crlExtension = cert.extensions.find(extension => extension.type === CRL_REASON_CODE_EXTENSION)
  if (!crlExtension) {
    return null
  }
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

const getX509IssuerId = (x509Certificate: X509): jsrsasign.Hex => {
  return x509Certificate.getExtAuthorityKeyIdentifier().kid
}

const getSubCaCerts = (): Array<string> => process.env.SUBCACC_CERT.split(",")

export {
  getCertificateFromPrescription,
  getCertificateTextFromPrescription,
  getPrescriptionId,
  getPrescriptionSignatureDate,
  getRevocationList,
  getRevokedCertReasonCode,
  getRevokedCertSerialNumber,
  getSubCaCerts,
  getX509DistributionPointsURI,
  getX509IssuerId,
  getX509SerialNumber,
  wasPrescriptionSignedAfterRevocation,
  newGetRevokedCertReasonCode
}
