import * as TestResources from "../resources/test-resources"
import {
  extractSignatureRootFromParentPrescription,
  verifyPrescriptionSignatureValid,
  verifySignatureDigestMatchesPrescription,
  verifySignatureHasCorrectFormat
} from "../../src/services/signature-verification"
import {clone} from "../resources/test-helpers"

describe("verifySignatureHasCorrectFormat...", () => {
  const validSignature = TestResources.parentPrescriptions.validSignature.ParentPrescription

  test("returns true if prescriptions signature has valid fields", () => {
    const result = verifySignatureHasCorrectFormat(validSignature)
    expect(result).toEqual(true)
  })

  test("returns false if prescriptions signature doesn't have signedInfo", () => {
    const clonePrescription = clone(validSignature)
    const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
    delete signatureRoot.Signature.SignedInfo
    const result = verifySignatureHasCorrectFormat(clonePrescription)
    expect(result).toEqual(false)
  })

  test("returns false if prescriptions signature doesn't have signatureValue", () => {
    const clonePrescription = clone(validSignature)
    const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
    delete signatureRoot.Signature.SignatureValue._text
    const result = verifySignatureHasCorrectFormat(clonePrescription)
    expect(result).toEqual(false)
  })

  test("returns false if prescriptions signature doesn't have X509Cert", () => {
    const clonePrescription = clone(validSignature)
    const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
    delete signatureRoot.Signature.KeyInfo.X509Data.X509Certificate._text
    const result = verifySignatureHasCorrectFormat(clonePrescription)
    expect(result).toEqual(false)
  })
})

describe("verifySignatureDigestMatchesPrescription...", () => {
  const validSignature = TestResources.parentPrescriptions.validSignature.ParentPrescription
  const nonMatchingSignature = TestResources.parentPrescriptions.nonMatchingSignature.ParentPrescription

  test("Prescription with digest that matches prescription returns true", () => {
    const result = verifySignatureDigestMatchesPrescription(validSignature)
    expect(result).toEqual(true)
  })

  test("Prescription with digest that doesn't matches prescription returns false", () => {
    const result = verifySignatureDigestMatchesPrescription(nonMatchingSignature)
    expect(result).toEqual(false)
  })
})

describe("verifyPrescriptionSignatureValid...", () => {
  const validSignature = TestResources.parentPrescriptions.validSignature.ParentPrescription
  const invalidSignature = TestResources.parentPrescriptions.invalidSignature.ParentPrescription

  test("Prescription with valid Signature that matches prescription returns true", () => {
    const result = verifyPrescriptionSignatureValid(validSignature)
    expect(result).toEqual(true)
  })

  test("Prescription with invalid Signature that doesn't matches prescription returns false", () => {
    const result = verifyPrescriptionSignatureValid(invalidSignature)
    expect(result).toEqual(false)
  })
})
