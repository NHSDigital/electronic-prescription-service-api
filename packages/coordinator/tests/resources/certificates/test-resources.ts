/**
 * Mock certificates for signature verification unit tests.
 */

import path from "path"
import * as fs from "fs"
import {fromBER} from "asn1js"
import * as asn1js from "asn1js"
import {X509} from "jsrsasign"
import {Certificate, CertificateRevocationList} from "pkijs"
import {X509Crl, X509Certificate} from "@peculiar/x509"
// import {Asn1Ob} from "pvtsutils"

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
  const asn1 = asn1js.fromBER(ber)
  // conevrtFunc(contents)
  return new Certificate({schema: asn1.result})
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

const newDecodeCertificate = (contents: string) => {
  const der = getBufferFromPem(contents)
  return new X509Certificate(der)
}

const decodeValidCertificate = (contents: string) => {
  const ber = getBERFromPEM(contents, REGEX_CERTIFICATE)
  return new X509Certificate(ber)
}

const decodeCrl = (contents: string) => {
  const ber = getBERFromPEM(contents, REGEX_X509_CRL)
  const asn1 = fromBER(ber)
  return new CertificateRevocationList({schema: asn1.result})
}

const newDecodeCrl = (contents: string) => {
  const ber = getBERFromPEM(contents, REGEX_X509_CRL)
  return new X509Crl(ber)
}

export const convertCertToX509Cert = (cert: Certificate): X509 => {
  const certString = cert.toString()
  return new X509(certString)
}

type MockCertificates = { [key: string]: Certificate }
type NewMockCertificates = {[key: string]: X509Certificate}

const validCertificates: MockCertificates = {
  certificate: decodeCertificate(
    readFile("certs/validSmartcard.pem")
  )
}

const newValidCertificates = {
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

const newRevokedCertificates: NewMockCertificates = {
  cessationOfOperation: newDecodeCertificate(
    readFile("certs/cessationOfOperation.pem")
  ),
  keyCompromise: newDecodeCertificate(
    readFile("certs/keyCompromise.pem")
  ),
  cACompromise: newDecodeCertificate(
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
const newRevocationList: X509Crl = newDecodeCrl(encodedRevocationList)

export type {MockCertificates, NewMockCertificates}
export {
  berRevocationList,
  revocationList,
  revokedCertificates,
  staticCaCerts,
  validCertificates,
  newRevocationList,
  newRevokedCertificates,
  newValidCertificates
}
