import {fromBER} from "asn1js"
import axios from "axios"
import {X509} from "jsrsasign"
import {CertificateRevocationList} from "pkijs"

import {RevokedCertificate} from "pkijs"
import {bufferToHexCodes} from "pvutils"
import {hl7V3} from "@models"
import {convertHL7V3DateTimeToIsoDateTimeString} from "../../translation/common/dateTime"
import {extractSignatureDateTimeStamp, getCertificateTextFromPrescription} from "../common"

const CRL_REASON_CODE_EXTENSION = "2.5.29.21"
const ALLOWED_CRL_DISTRIBUTION_URL_REGEX = new RegExp("(http://example.com|http://crl.nhs.uk)(.*)(.crl)")

const getRevokedCertSerialNumber = (cert: RevokedCertificate): string => {
  const certHexValue = cert.userCertificate.valueBlock.valueHexView
  return bufferToHexCodes(certHexValue).toLocaleLowerCase()
}

const getRevokedCertReasonCode = (cert: RevokedCertificate): number => {
  const crlExtension = cert.crlEntryExtensions?.extensions.find(ext => ext.extnID === CRL_REASON_CODE_EXTENSION)
  return crlExtension ? parseInt(crlExtension.parsedValue.valueBlock) : null
}

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

const isValidCrlDistributionPointUrl = (url?: string): boolean => {
  return url && ALLOWED_CRL_DISTRIBUTION_URL_REGEX.test(url)
}

const getRevocationList = async (crlFileUrl: string): Promise<CertificateRevocationList> => {
  const resp = await axios(crlFileUrl, {method: "GET", responseType: "arraybuffer"})
  if (resp.status === 200) {
    const asn1crl = fromBER(resp.data)
    return new CertificateRevocationList({schema: asn1crl.result})
  }
}

const getPrescriptionId = (parentPrescription: hl7V3.ParentPrescription): string => {
  return parentPrescription.id._attributes.root
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

export {
  getPrescriptionId,
  getRevocationList,
  getX509SerialNumber,
  getRevokedCertSerialNumber,
  getRevokedCertReasonCode,
  getCertificateFromPrescription,
  getCertificateTextFromPrescription,
  getPrescriptionSignatureDate,
  wasPrescriptionSignedAfterRevocation,
  isValidCrlDistributionPointUrl
}
