import {ElementCompact} from "xml-js"
import {hl7V3} from "@models"
import {writeXmlStringCanonicalized} from "./serialisation/xml"
import {convertFragmentsToHashableFormat, extractFragments} from "./translation/request/signature"
import {createParametersDigest} from "./translation/request"
import crypto from "crypto"

export function warnIfSignatureIsInvalid(prescriptionRoot: ElementCompact): void {
  const signatureValid = verifyPrescriptionSignatureValid(prescriptionRoot)
  if (!signatureValid) {
    console.warn(
      `Signature is not valid for Bundle: ${prescriptionRoot.PORX_IN020101SM31.id._attributes.root}`
    )
  }
}

export function verifySignatureMatchesPrescription(prescriptionRoot: ElementCompact): boolean {
  const signatureRoot = extractSignatureRootFromPrescriptionRoot(prescriptionRoot)
  const digestFromSignature = extractDigestFromSignatureRoot(signatureRoot)
  const digestFromPrescription = calculateDigestFromPrescriptionRoot(prescriptionRoot)
  const digestMatches = digestFromPrescription === digestFromSignature
  return digestMatches
}

export function warnIfDigestDoesNotMatchPrescription(prescriptionRoot: ElementCompact): void {
  const digestMatches = verifySignatureMatchesPrescription(prescriptionRoot)
  if (!digestMatches) {
    console.warn(`Digest did not match for Bundle: ${prescriptionRoot.PORX_IN020101SM31.id._attributes.root}`)
  }
}

export function verifyPrescriptionSignatureValid(prescriptionRoot: ElementCompact): boolean {
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
