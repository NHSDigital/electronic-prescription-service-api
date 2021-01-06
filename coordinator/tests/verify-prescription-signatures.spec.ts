import {ElementCompact} from "xml-js"
import {readXml, writeXmlStringCanonicalized} from "../src/services/serialisation/xml"
import * as crypto from "crypto"
import {readFileSync} from "fs"
import * as path from "path"
import {SendMessagePayload} from "../src/models/hl7-v3/hl7-v3-datatypes-core"
import {ParentPrescriptionRoot} from "../src/models/hl7-v3/hl7-v3-prescriptions"
import {createParametersDigest} from "../src/services/translation"
import {convertFragmentsToHashableFormat, extractFragments} from "../src/services/translation/prescription/signature"
import {toArray} from "../src/services/translation/common"
import {specification} from "./resources/test-resources"

function extractDigestFromSignatureRoot(signatureRoot: ElementCompact) {
  const signature = signatureRoot.Signature
  const signedInfo = signature.SignedInfo
  signedInfo._attributes = {
    xmlns: signature._attributes.xmlns
  }
  return writeXmlStringCanonicalized({SignedInfo: signedInfo})
}

function verifySignatureValid(signatureRoot: ElementCompact) {
  const digest = extractDigestFromSignatureRoot(signatureRoot)
  const signature = signatureRoot.Signature
  const signatureValue = signature.SignatureValue._text
  const certificateValue = signature.KeyInfo.X509Data.X509Certificate._text
  const certificateValueWithStuff = `-----BEGIN CERTIFICATE-----\n${certificateValue}\n-----END CERTIFICATE-----`
  const signatureVerifier = crypto.createVerify("RSA-SHA1")
  signatureVerifier.update(digest)
  return signatureVerifier.verify(certificateValueWithStuff, signatureValue, "base64")
}

function verifySignatureValidAndMatchesPrescription(prescriptionRoot: ElementCompact) {
  const sendMessagePayload = prescriptionRoot.PORX_IN020101SM31 as SendMessagePayload<ParentPrescriptionRoot>
  const parentPrescription = sendMessagePayload.ControlActEvent.subject.ParentPrescription
  const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription
  const signatureRoot = pertinentPrescription.author.signatureText as ElementCompact
  const digestFromSignature = extractDigestFromSignatureRoot(signatureRoot)

  pertinentPrescription.pertinentInformation2 = toArray(pertinentPrescription.pertinentInformation2)
  const fragments = extractFragments(parentPrescription)
  const fragmentsToBeHashed = convertFragmentsToHashableFormat(fragments)
  const digestFromPrescriptionBase64 = createParametersDigest(fragmentsToBeHashed)
  const digestFromPrescription = Buffer.from(digestFromPrescriptionBase64, "base64").toString("utf-8")

  if (digestFromPrescription !== digestFromSignature) {
    return false
  }

  return verifySignatureValid(signatureRoot)
}

test.skip("verify prescription signature for specific prescription", () => {
  //eslint-disable-next-line max-len
  const prescriptionPath = "../../models/examples/secondary-care/community/acute/nominated-pharmacy/clinical-practitioner/1-Convert-Response-Send-200_OK.xml"
  const prescriptionStr = readFileSync(path.join(__dirname, prescriptionPath), "utf-8")
  const prescriptionRoot = readXml(prescriptionStr)
  const result = verifySignatureValidAndMatchesPrescription(prescriptionRoot)
  expect(result).toBeTruthy()
})

const cases = specification.map(examplePrescription => [
  examplePrescription.description,
  examplePrescription.hl7V3Message
])

test.skip.each(cases)("verify prescription signature for %s", (desc: string, hl7V3Message: ElementCompact) => {
  const result = verifySignatureValidAndMatchesPrescription(hl7V3Message)
  expect(result).toBeTruthy()
})
