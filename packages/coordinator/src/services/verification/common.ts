import {ElementCompact} from "xml-js"
import {hl7V3} from "@models"

export const getCertificateTextFromPrescription = (prescription: hl7V3.ParentPrescription): string => {
  const signatureRoot = extractSignatureRootFromParentPrescription(prescription)
  const signature = signatureRoot?.Signature
  return signature?.KeyInfo?.X509Data?.X509Certificate?._text
}

export function extractSignatureRootFromParentPrescription(
  parentPrescription: hl7V3.ParentPrescription
): ElementCompact {
  const pertinentPrescription = parentPrescription.pertinentInformation1.pertinentPrescription
  return pertinentPrescription.author.signatureText
}

export function extractSignatureDateTimeStamp(parentPrescriptions: hl7V3.ParentPrescription): hl7V3.Timestamp {
  const author = parentPrescriptions.pertinentInformation1.pertinentPrescription.author
  return author.time
}
