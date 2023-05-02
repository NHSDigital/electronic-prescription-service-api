/**
 * Mock certificates for signature verification unit tests.
 */

import path from "path"
import * as fs from "fs"
import {fromBER} from "asn1js"
import {X509} from "jsrsasign"
import {Certificate, CertificateRevocationList} from "pkijs"

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
const decodeCertificate = (contents: string) => {
  const ber = getBERFromPEM(contents, REGEX_CERTIFICATE)
  const asn1 = fromBER(ber)
  return new Certificate({schema: asn1.result})
}

const decodeCrl = (contents: string) => {
  const ber = getBERFromPEM(contents, REGEX_X509_CRL)
  const asn1 = fromBER(ber)
  return new CertificateRevocationList({schema: asn1.result})
}

export const convertCertToX509Cert = (cert: Certificate): X509 => {
  const certString = cert.toString()
  return new X509(certString)
}

type MockCertificates = { [key: string]: Certificate }

const validCertificates: MockCertificates = {
  certificate: decodeCertificate(
    readFile("certs/validSmartcard.pem")
  )
}

const revokedCertificates: MockCertificates = {
  cessationOfOperation: decodeCertificate(
    readFile("certs/cessationOfOperation.pem")
  ),
  keyCompromise: decodeCertificate(
    readFile("certs/keyCompromise.pem")
  ),
  cACompromise: decodeCertificate(
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
const revocationList: CertificateRevocationList = decodeCrl(encodedRevocationList)

export type {MockCertificates}
export {
  berRevocationList,
  revocationList,
  revokedCertificates,
  staticCaCerts,
  validCertificates
}
