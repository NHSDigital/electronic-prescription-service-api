import {fromBER} from "asn1js"
import axios from "axios"
import {X509} from "jsrsasign"
import {CertificateRevocationList} from "pkijs"

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
  getRevocationList,
  getX509SerialNumber
}
