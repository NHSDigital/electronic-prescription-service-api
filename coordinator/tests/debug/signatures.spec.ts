import {readFileSync, writeFileSync} from "fs"
import * as path from "path"
import {convertParentPrescription} from "../../src/services/translation/request/prescribe/parent-prescription"
import pino from "pino"
import {Bundle} from "../../../models/fhir"
import * as LosslessJson from "lossless-json"
import {ParentPrescription} from "../../../models/hl7-v3/parent-prescription"
import {convertFragmentsToHashableFormat, extractFragments} from "../../src/services/translation/request/signature"
import * as crypto from "crypto"
import * as cryptojs from "crypto-js"
import {readXml, writeXmlStringPretty} from "../../src/services/serialisation/xml"
import {hl7V3} from "@models"
import {
  extractSignatureRootFromParentPrescription,
  verifyPrescriptionSignatureValid,
  verifySignatureDigestMatchesPrescription
} from "../../src/services/signature-verification"
import {createParametersDigest} from "../../src/services/translation/request"
import * as forge from "node-forge"

const logger = pino()

/* eslint-disable max-len */

const basePath = "../../../examples/primary-care/repeat-dispensing/nominated-pharmacy/medical-prescriber/author/gmc/responsible-party/medication-list/din"
const sendRequestFilePath = `${basePath}/1-Process-Request-Send-200_OK.json`
const verifyRequestFilePath = `${basePath}/1-VerifySignature-Request-200_OK.json`

test.skip("compare signature fragments for specific send and verify-signature FHIR prescription", () => {
  const sendFhirStr = readFileSync(
    path.join(__dirname, sendRequestFilePath),
    "utf-8"
  )
  const sendFhir: Bundle = LosslessJson.parse(sendFhirStr)
  const parentPrescription1 = convertParentPrescription(
    sendFhir,
    logger
  ) as ParentPrescription
  const signatureFragments1 = extractFragments(parentPrescription1)
  expect(signatureFragments1).toMatchSnapshot()

  const verifyFhirStr = readFileSync(
    path.join(__dirname, verifyRequestFilePath),
    "utf-8"
  )
  const verifyFhir = LosslessJson.parse(verifyFhirStr)
  const prescription = verifyFhir.entry[0].resource as Bundle
  const parentPrescription2 = convertParentPrescription(
    prescription,
    logger
  ) as ParentPrescription
  const signatureFragments2 = extractFragments(parentPrescription2)
  expect(signatureFragments2).toMatchSnapshot()

  expect(signatureFragments2).toMatchSnapshot(signatureFragments1)
})

test.skip("create x509 and private pem files to use for RS256 signing operations", () => {
  const keys = forge.pki.rsa.generateKeyPair(2048)
  const cert = forge.pki.createCertificate()
  cert.publicKey = keys.publicKey
  cert.serialNumber = "01" + crypto.randomBytes(19).toString("hex")
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1)
  const attrs = [{
    name: "commonName",
    value: "example.org"
  }, {
    name: "countryName",
    value: "UK"
  }, {
    shortName: "ST",
    value: "LEEDS"
  }, {
    name: "localityName",
    value: "YORKSHIRE"
  }, {
    name: "organizationName",
    value: "NHS SELF SIGNED DEV"
  }, {
    shortName: "OU",
    value: "TEST"
  }]
  cert.setSubject(attrs)
  cert.setIssuer(attrs)
  cert.setExtensions([{
    name: "basicConstraints",
    cA: true
  }, {
    name: "keyUsage",
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true
  }, {
    name: "extKeyUsage",
    serverAuth: true,
    clientAuth: true,
    codeSigning: true,
    emailProtection: true,
    timeStamping: true
  }, {
    name: "nsCertType",
    client: true,
    server: true,
    email: true,
    objsign: true,
    sslCA: true,
    emailCA: true,
    objCA: true
  }, {
    name: "subjectAltName",
    altNames: [{
      type: 6, // URI
      value: "https://internal-dev.api.service.nhs.uk"
    }, {
      type: 7, // IP
      ip: "127.0.0.1"
    }]
  }, {
    name: "subjectKeyIdentifier"
  }])

  // self-sign certificate
  cert.sign(keys.privateKey)

  // convert a Forge certificate to X509 pem
  const pem = forge.pki.certificateToPem(cert)
  console.info("x509 certificate: %s", pem)

  // convert forge private key to pem and save to use for signing
  const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey)
  writeFileSync(
    path.join(__dirname, "../resources/certificates/privateKey.pem"),
    privateKeyPem,
    "utf-8"
  )

  // save x509 pem to use for signing verification
  writeFileSync(
    path.join(__dirname, "../resources/certificates/x509.pem"),
    pem,
    "utf-8"
  )
})

test.skip("sign and verify a prescription with RS256", () => {
  // load private key and x509 certificate
  const privateKeyPem = readFileSync(
    path.join(__dirname, "../resources/certificates/privateKey.pem"),
    "utf-8"
  )
  const x509Pem = readFileSync(
    path.join(__dirname, "../resources/certificates/x509.pem"),
    "utf-8"
  )

  // load hl7v3 example
  const validSignatureXmlString = readFileSync(
    path.join(__dirname, "../resources/signed-prescriptions/ValidSignature.xml"),
    "utf-8"
  )

  // calculate digest
  const parentPrescriptionRoot = readXml(validSignatureXmlString) as hl7V3.ParentPrescriptionRoot
  const parentPrescription = parentPrescriptionRoot.ParentPrescription
  const fragments = extractFragments(parentPrescription)
  const fragmentsToBeHashed = convertFragmentsToHashableFormat(fragments)
  const digest = Buffer.from(createParametersDigest(fragmentsToBeHashed), "base64").toString("utf-8")
  const digestValue = cryptojs.SHA256(fragmentsToBeHashed).toString(cryptojs.enc.Base64)
  //console.info("digestValue: %s", digestValue)

  // sign
  const signerObject = crypto.createSign("RSA-SHA256")
  signerObject.update(digest)
  const signature = signerObject.sign({key: privateKeyPem, padding: crypto.constants.RSA_PKCS1_PADDING}, "base64")
  //console.info("signature: %s", signature)

  // update hl7v3 example
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  const signatureElement = signatureRoot.Signature
  signatureElement.SignatureValue._text = signature
  signatureElement.KeyInfo.X509Data.X509Certificate._text = Buffer.from(x509Pem, "utf-8").toString("base64")
  signatureElement.SignedInfo.Reference.DigestValue = digestValue
  writeFileSync(
    path.join(__dirname, "../resources/signed-prescriptions/ValidSignature.xml"),
    writeXmlStringPretty(parentPrescriptionRoot),
    "utf-8"
  )

  // check digest is correct
  const matchingSignature = verifySignatureDigestMatchesPrescription(parentPrescription)
  expect(matchingSignature).toBe(true)

  // verify signature
  const validSignature = verifyPrescriptionSignatureValid(parentPrescription)
  expect(validSignature).toBe(true)
})

/* eslint-enable max-len */
