import {ElementCompact} from "xml-js"
import {readXml, writeXmlStringCanonicalized} from "../src/services/serialisation/xml"
import * as crypto from "crypto"
import {readFileSync} from "fs"
import * as path from "path"
import {SendMessagePayload} from "../src/models/hl7-v3/hl7-v3-datatypes-core"
import {ParentPrescriptionRoot} from "../src/models/hl7-v3/hl7-v3-prescriptions"
import {createParametersDigest} from "../src/services/translation"
import {convertFragmentsToHashableFormat, extractFragments} from "../src/services/translation/prescription/signature"
import {specification} from "./resources/test-resources"

test.skip("verify prescription signature for specific prescription", () => {
  //eslint-disable-next-line max-len
  const prescriptionPath = "../../models/examples/secondary-care/community/acute/nominated-pharmacy/clinical-practitioner/1-Convert-Response-Send-200_OK.xml"
  const prescriptionStr = readFileSync(path.join(__dirname, prescriptionPath), "utf-8")
  const prescriptionRoot = readXml(prescriptionStr)
  expectSignatureMatchesPrescriptionAndIsValid(prescriptionRoot)
})

const cases = specification.map(examplePrescription => [
  examplePrescription.description,
  examplePrescription.hl7V3Message
])

test.skip.each(cases)("verify prescription signature for %s", (desc: string, hl7V3Message: ElementCompact) => {
  expectSignatureMatchesPrescriptionAndIsValid(hl7V3Message)
})

function expectSignatureMatchesPrescriptionAndIsValid(prescriptionRoot: ElementCompact) {
  const signatureMatchesPrescription = verifyPrescriptionSignatureMatchesPrescription(prescriptionRoot)
  const signatureValid = verifyPrescriptionSignatureValid(prescriptionRoot)
  console.log(`Signature matches prescription: ${signatureMatchesPrescription}. Signature valid: ${signatureValid}`)
  expect(signatureMatchesPrescription).toBeTruthy()
  expect(signatureValid).toBeTruthy()
}

function verifyPrescriptionSignatureMatchesPrescription(prescriptionRoot: ElementCompact) {
  const signatureRoot = extractSignatureRootFromPrescriptionRoot(prescriptionRoot)
  const digestFromSignature = extractDigestFromSignatureRoot(signatureRoot)
  const digestFromPrescription = calculateDigestFromPrescriptionRoot(prescriptionRoot)
  return digestFromPrescription === digestFromSignature
}

function verifyPrescriptionSignatureValid(prescriptionRoot: ElementCompact) {
  const signatureRoot = extractSignatureRootFromPrescriptionRoot(prescriptionRoot)
  return verifySignatureValid(signatureRoot)
}

function extractSignatureRootFromPrescriptionRoot(prescriptionRoot: ElementCompact): ElementCompact {
  const sendMessagePayload = prescriptionRoot.PORX_IN020101SM31 as SendMessagePayload<ParentPrescriptionRoot>
  const parentPrescription = sendMessagePayload.ControlActEvent.subject.ParentPrescription
  const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription
  return pertinentPrescription.author.signatureText
}

function extractDigestFromSignatureRoot(signatureRoot: ElementCompact) {
  const signature = signatureRoot.Signature
  const signedInfo = signature.SignedInfo
  signedInfo._attributes = {
    xmlns: signature._attributes.xmlns
  }
  return writeXmlStringCanonicalized({SignedInfo: signedInfo})
}

function calculateDigestFromPrescriptionRoot(prescriptionRoot: ElementCompact) {
  const sendMessagePayload = prescriptionRoot.PORX_IN020101SM31 as SendMessagePayload<ParentPrescriptionRoot>
  const parentPrescription = sendMessagePayload.ControlActEvent.subject.ParentPrescription
  const fragments = extractFragments(parentPrescription)
  const fragmentsToBeHashed = convertFragmentsToHashableFormat(fragments)
  const digestFromPrescriptionBase64 = createParametersDigest(fragmentsToBeHashed)
  return Buffer.from(digestFromPrescriptionBase64, "base64").toString("utf-8")
}

function verifySignatureValid(signatureRoot: ElementCompact) {
  const signatureVerifier = crypto.createVerify("RSA-SHA1")
  const digest = extractDigestFromSignatureRoot(signatureRoot)
  signatureVerifier.update(digest)
  const signature = signatureRoot.Signature
  const signatureValue = signature.SignatureValue._text
  const x509Certificate = signature.KeyInfo.X509Data.X509Certificate._text
  const x509CertificatePem = `-----BEGIN CERTIFICATE-----\n${x509Certificate}\n-----END CERTIFICATE-----`
  return signatureVerifier.verify(x509CertificatePem, signatureValue, "base64")
}
