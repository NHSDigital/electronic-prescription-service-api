/**
 * Mock certificates for signature verification unit tests.
 */

import path from "path"
import * as fs from "fs"
import {fromBER} from "asn1js"
import {Certificate} from "pkijs"

const getCertificate = (filename: string) => {
  const filePath = path.join(__dirname, `./certificates/certs/${filename}`)
  return fs.readFileSync(filePath, "utf-8")
}

// Source https://gist.github.com/adisbladis/c84e533e591b1737fedd26658021fef2
const decodeCertificate = (contents: string) => {
  const b64 = contents.replace(/(-----(BEGIN|END) CERTIFICATE-----|[\n\r])/g, "")
  const der = Buffer.from(b64, "base64")
  const ber = new Uint8Array(der).buffer
  const asn1 = fromBER(ber)
  return new Certificate({schema: asn1.result})
}

export const validCertificates = {
  certificate: decodeCertificate(
    getCertificate("cessationOfOperation.pem")
  )
}

export const revokedCertificates = {
  cessationOfOperation: decodeCertificate(
    getCertificate("cessationOfOperation.pem")
  ),
  keyCompromise: decodeCertificate(
    getCertificate("keyCompromise.pem")
  ),
  cACompromise: decodeCertificate(
    getCertificate("cACompromise.pem")
  )
}
