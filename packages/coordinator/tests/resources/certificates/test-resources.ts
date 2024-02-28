/**
 * Mock certificates for signature verification unit tests.
 */

import path from "path"
import * as fs from "fs"
// import {fromBER} from "asn1js"
import {X509} from "jsrsasign"
// import {Certificate, CertificateRevocationList} from "pkijs"
import {X509Certificate, X509Crl, X509CrlEntry} from "@peculiar/x509"

const REGEX_CERTIFICATE = /(-----(BEGIN|END) CERTIFICATE-----|[\n\r])/g
const REGEX_X509_CRL = /(-----(BEGIN|END) X509 CRL-----|[\n\r])/g

const readFile = (filename: string): string => {
  const filePath = path.join(__dirname, `./${filename}`)
  return fs.readFileSync(filePath, "utf-8")
}

const getBERFromPEM = (contents: string, delimiter: RegExp): ArrayBufferLike => {
  const b64 = contents.replace(delimiter, "")
  const der = Buffer.from(b64, "base64")
  return new Uint8Array(der).buffer
}

// Source https://gist.github.com/adisbladis/c84e533e591b1737fedd26658021fef2
const decodeRevokedCertificate = (contents: string) => {
  const ber = getBERFromPEM(contents, REGEX_CERTIFICATE)
  return new X509CrlEntry(ber)
}

const decodeValidCertificate = (contents: string) => {
  const ber = getBERFromPEM(contents, REGEX_CERTIFICATE)
  return new X509Certificate(ber)
}
// const decodeCertificate = (contents: string) => {
//   const ber = getBERFromPEM(contents, REGEX_CERTIFICATE)

//   try {
//     // const asn1 = fromBER(ber)

//     // Attempt to decode as X509Certificate
//     try {
//       return new X509Certificate(ber)
//     } catch (error) {
//       return new X509CrlEntry(ber)
//     }
//   } catch (error) {
//     // Handle other decoding errors
//     return null
//   }
// }

const decodeCrl = (contents: string) => {
  const ber = getBERFromPEM(contents, REGEX_X509_CRL)
  // const asn1 = fromBER(ber)
  // return new CertificateRevocationList({schema: asn1.result})
  return new X509Crl(ber)
}

//changed Certificate to x509crlentry
export const convertCertToX509Cert = (cert: X509CrlEntry): X509 => {
  const certString = cert.toString()
  return new X509(certString)
}

//changed Certificate to x509crlentry

type MockRevokedCertificates = { [key: string]: X509CrlEntry }
type MockValidCertificates = { [key: string]: X509Certificate}

const validCertificates: MockValidCertificates = {
  certificate: decodeValidCertificate(
    readFile("certs/validSmartcard.pem")
  )
}

const revokedCertificates: MockRevokedCertificates = {
  cessationOfOperation: decodeRevokedCertificate(
    readFile("certs/cessationOfOperation.pem")
  ),
  keyCompromise: decodeRevokedCertificate(
    readFile("certs/keyCompromise.pem")
  ),
  cACompromise: decodeRevokedCertificate(
    readFile("certs/cACompromise.pem")
  )
}

type StaticMockCerts = { caCert: string, revokedCaCert: string, caArl: ArrayBufferLike }

// See packages/coordinator/tests/resources/certificates/static/README.md
const staticCaCerts: StaticMockCerts = {
  caCert: readFile("static/ca.pem"),
  revokedCaCert: readFile("static/revokedCa.pem"),
  caArl: getBERFromPEM(readFile("static/ca.crl"), REGEX_X509_CRL)
}

const encodedRevocationList = readFile("crl/ca.crl")
const berRevocationList: ArrayBufferLike = getBERFromPEM(encodedRevocationList, REGEX_X509_CRL)
// const revocationList: CertificateRevocationList = decodeCrl(encodedRevocationList)
const revocationList: X509Crl = decodeCrl(encodedRevocationList)

export type {MockRevokedCertificates, MockValidCertificates}
export {
  berRevocationList,
  revocationList,
  revokedCertificates,
  staticCaCerts,
  validCertificates
}
