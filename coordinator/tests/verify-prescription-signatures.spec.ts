import {ElementCompact} from "xml-js"
import {
  readXml,
  writeXmlStringCanonicalized
}
from "../src/services/serialisation/xml"
import * as crypto from "crypto"
import {readFileSync} from "fs"
import * as path from "path"
import {createParametersDigest} from "../src/services/translation/request"
import {convertFragmentsToHashableFormat, extractFragments} from "../src/services/translation/request/signature"
import * as hl7V3 from "../src/models/hl7-v3"
import {fetcher} from "@models"

//eslint-disable-next-line max-len
const prescriptionPath = "../../models/examples/primary-care/acute/no-nominated-pharmacy/medical-prescriber/author/gmc/responsible-party/spurious-code/1-Convert-Response-Send-200_OK.xml"

test.skip("verify digest for specific prescription", () => {
  const prescriptionStr = readFileSync(path.join(__dirname, prescriptionPath), "utf-8")
  const prescriptionRoot = readXml(prescriptionStr)
  warnIfDigestDoesNotMatchPrescription(prescriptionRoot)
})

test.skip("verify signature for specific prescription", () => {
  const prescriptionStr = readFileSync(path.join(__dirname, prescriptionPath), "utf-8")
  const prescriptionRoot = readXml(prescriptionStr)
  warnIfSignatureIsInvalid(prescriptionRoot)
})

const cases = fetcher.convertExamples
  .filter(e => e.isSuccess)
  .filter(e => e.description.includes("200-OK send"))
  .map(convertExample => [
    convertExample.description,
    readXml(convertExample.response)
  ])

test.each(cases)("verify prescription signature for %s", (desc: string, hl7V3Message: ElementCompact) => {
  warnIfDigestDoesNotMatchPrescription(hl7V3Message)
  warnIfSignatureIsInvalid(hl7V3Message)
})

function warnIfSignatureIsInvalid(prescriptionRoot: ElementCompact) {
  const signatureValid = verifyPrescriptionSignatureValid(prescriptionRoot)
  if (!signatureValid) {
    console.warn(`Signature is not valid for Bundle: ${prescriptionRoot.PORX_IN020101SM31.id._attributes.root}`)
  }
}

function warnIfDigestDoesNotMatchPrescription(prescriptionRoot: ElementCompact) {
  const signatureRoot = extractSignatureRootFromPrescriptionRoot(prescriptionRoot)
  const digestFromSignature = extractDigestFromSignatureRoot(signatureRoot)
  const digestFromPrescription = calculateDigestFromPrescriptionRoot(prescriptionRoot)
  const digestMatches = digestFromPrescription === digestFromSignature
  if (!digestMatches) {
    console.warn(`Digest did not match for Bundle: ${prescriptionRoot.PORX_IN020101SM31.id._attributes.root}`)
  }
}

function verifyPrescriptionSignatureValid(prescriptionRoot: ElementCompact) {
  const signatureRoot = extractSignatureRootFromPrescriptionRoot(prescriptionRoot)
  return verifySignatureValid(signatureRoot)
}

function extractSignatureRootFromPrescriptionRoot(prescriptionRoot: ElementCompact): ElementCompact {
  // eslint-disable-next-line max-len
  const sendMessagePayload = prescriptionRoot.PORX_IN020101SM31 as hl7V3.SendMessagePayload<hl7V3.ParentPrescriptionRoot>
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
  // eslint-disable-next-line max-len
  const sendMessagePayload = prescriptionRoot.PORX_IN020101SM31 as hl7V3.SendMessagePayload<hl7V3.ParentPrescriptionRoot>
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
