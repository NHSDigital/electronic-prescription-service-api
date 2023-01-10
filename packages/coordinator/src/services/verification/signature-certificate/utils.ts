import {fromBER} from "asn1js"
import axios from "axios"
import {X509} from "jsrsasign"
import {CertificateRevocationList} from "pkijs"
import {ElementCompact} from "xml-js"
import {hl7V3} from "@models"

function extractSignatureRootFromParentPrescription(
  parentPrescription: hl7V3.ParentPrescription
): ElementCompact {
  const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription
  return pertinentPrescription.author.signatureText
}

function extractSignatureDateTimeStamp(parentPrescriptions: hl7V3.ParentPrescription): hl7V3.Timestamp {
  const author = parentPrescriptions.pertinentInformation1.pertinentPrescription.author
  return author.time
}

const getRevocationList = async (crlFileUrl: string): Promise<CertificateRevocationList> => {
  const resp = await axios(crlFileUrl, {method: "GET", responseType: "arraybuffer"})
  if (resp.status === 200) {
    const asn1crl = fromBER(resp.data)
    return new CertificateRevocationList({schema: asn1crl.result})
  }
}

/**
 * returns the serial number of an X509 certificate
 * separated into standalone function for mocking in unit tests
 * @param x509Certificate
 * @returns serial number string
 */
const getX509SerialNumber = (x509Certificate: X509): string => {
  return x509Certificate.getSerialNumberHex()
}

export {
  extractSignatureRootFromParentPrescription,
  extractSignatureDateTimeStamp,
  getRevocationList,
  getX509SerialNumber
}
