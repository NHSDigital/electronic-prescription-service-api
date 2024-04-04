/**
 * Mock certificates for signature verification unit tests.
 */

import path from "path"
import * as fs from "fs"
import {X509Crl, X509Certificate} from "@peculiar/x509"

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

const getBufferFromPem = (contents: string): Buffer => {
  const pemStartIndex = contents.indexOf("-----BEGIN CERTIFICATE-----")
  const pemEndIndex = contents.indexOf("-----END CERTIFICATE-----") + 25
  if (pemStartIndex === -1 || pemEndIndex === -1) {
    throw new Error("Invalid PEM data")
  }
  const base64Data = contents.substring(pemStartIndex + 27, pemEndIndex)
  const base64Clean = base64Data.replace(/[\r\n]/g, "")
  return Buffer.from(base64Clean, "base64")
}

const decodeCertificate = (contents: string) => {
  const der = getBufferFromPem(contents)
  return new X509Certificate(der)
}

const decodeValidCertificate = (contents: string) => {
  const ber = getBERFromPEM(contents, REGEX_CERTIFICATE)
  return new X509Certificate(ber)
}

const decodeCrl = (contents: string) => {
  const ber = getBERFromPEM(contents, REGEX_X509_CRL)
  return new X509Crl(ber)
}

type MockCertificates = {[key: string]: X509Certificate}

const validCertificates = {
  certificate: decodeValidCertificate(
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
const revocationList: X509Crl = decodeCrl(encodedRevocationList)

export type {MockCertificates}
export {
  berRevocationList,
  staticCaCerts,
  revocationList,
  revokedCertificates,
  validCertificates
}
