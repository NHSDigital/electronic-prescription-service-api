import {ElementCompact} from "xml-js"
import {hl7V3} from "@models"
import crypto from "crypto"

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

export function getCertificateFromPrescriptionCrypto(signatureRoot: ElementCompact): crypto.X509Certificate {
  const x509CertificateText: string = signatureRoot.Signature.KeyInfo.X509Data.X509Certificate._text
  const x509Certificate = `-----BEGIN CERTIFICATE-----\n${x509CertificateText.trim()}\n-----END CERTIFICATE-----`
  return new crypto.X509Certificate(x509Certificate)
}
