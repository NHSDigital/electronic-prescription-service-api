import * as TestResources from "../../resources/test-resources"
import {
  extractSignatureRootFromParentPrescription,
  verifyPrescriptionSignatureValid,
  verifySignatureDigestMatchesPrescription,
  verifySignatureHasCorrectFormat,
  verifyCertificate,
  verifyChain
} from "../../../src/services/verification/signature-verification"
import {clone} from "../../resources/test-helpers"
import {X509Certificate} from "crypto"
import path from "path"
import fs from "fs"

describe("VerifyChain", () => {
  beforeAll(() => {
    process.env.SUBCACC_CERT_PATH = path.join(__dirname, "../../resources/certificates/NHS_INT_Level1D_Base64_pem.cer")
  })
  test("should return false when cert is not issued by SubCAcc", () => {
    const unTrustedCert = createX509Cert("../../resources/certificates/x509-not-trusted.cer")
    const result = verifyChain(unTrustedCert)
    expect(result).toEqual(false)
  })

  test("should return true when cert is issued by SubCAcc", () => {
    const trustedCert = createX509Cert("../../resources/certificates/x509-trusted.cer")
    const result = verifyChain(trustedCert)
    expect(result).toEqual(true)
  })

})

function createX509Cert(certPath: string): X509Certificate {
  const cert = fs.readFileSync(path.join(__dirname, certPath))
  return new X509Certificate(cert)
}

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

// TODO: Add tests for valid and invalid certificates
describe("verifyPrescriptionCertificateValid...", () => {
  const validSignature = TestResources.parentPrescriptions.validSignature.ParentPrescription

  test("returns true if prescription certificate is valid", () => {
    const result = verifyCertificate(validSignature)
    expect(result).toEqual(true)
  })
})
