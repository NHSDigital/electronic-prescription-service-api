import {ElementCompact} from "xml-js"
import {hl7V3} from "@models"
import {writeXmlStringCanonicalized} from "./serialisation/xml"
import {convertFragmentsToHashableFormat, extractFragments} from "./translation/request/signature"
import {createParametersDigest} from "./translation/request"
import crypto from "crypto"
import {isTruthy} from "./translation/common"

export function verifySignatureHasCorrectFormat(parentPrescription: hl7V3.ParentPrescription): boolean {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  const signature = signatureRoot?.Signature
  const signedInfo = signature?.SignedInfo
  const signatureValue = signature?.SignatureValue?._text
  const x509Certificate = signature?.KeyInfo?.X509Data?.X509Certificate?._text
  return isTruthy(signedInfo) && isTruthy(signatureValue) && isTruthy(x509Certificate)
}

export function verifySignatureDigestMatchesPrescription(
  parentPrescription: hl7V3.ParentPrescription,
  signatureAlgorithm: string
): boolean {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  const digestFromSignature = extractDigestFromSignatureRoot(signatureRoot)
  const digestFromPrescription = calculateDigestFromParentPrescription(parentPrescription, signatureAlgorithm)
  return digestFromPrescription === digestFromSignature
}

export function verifyPrescriptionSignatureValid(
  parentPrescription: hl7V3.ParentPrescription,
  signatureAlgorithm: string
): boolean {
  const signatureRoot = extractSignatureRootFromParentPrescription(parentPrescription)
  return verifySignatureValid(signatureRoot, signatureAlgorithm)
}

export function extractSignatureRootFromParentPrescription(
  parentPrescription: hl7V3.ParentPrescription
): ElementCompact {
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

function calculateDigestFromParentPrescription(
  parentPrescription: hl7V3.ParentPrescription,
  signatureAlgorithm: string
) {
  const fragments = extractFragments(parentPrescription)
  const fragmentsToBeHashed = convertFragmentsToHashableFormat(fragments)
  const digestFromPrescriptionBase64 = createParametersDigest(
    fragmentsToBeHashed,
    signatureAlgorithm
  )
  return Buffer.from(digestFromPrescriptionBase64, "base64").toString("utf-8")
}

function verifySignatureValid(signatureRoot: ElementCompact, hashingAlgorithm: string) {
  const digest = extractDigestFromSignatureRoot(signatureRoot)
  const signature = signatureRoot.Signature
  const signatureValue = signature.SignatureValue._text
  const x509Certificate = Buffer.from(signature.KeyInfo.X509Data.X509Certificate._text, "base64").toString("utf-8")
  const signatureAlgorithm = hashingAlgorithm === "RS256" ? "RSA-SHA256" : "RSA-SHA1"
  const signatureVerifier = crypto.createVerify(signatureAlgorithm)
  signatureVerifier.update(digest)
  return signatureVerifier.verify(
    {key: x509Certificate, padding: crypto.constants.RSA_PKCS1_PADDING}, signatureValue, "base64"
  )
}
