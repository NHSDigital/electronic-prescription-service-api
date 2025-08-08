import * as TestResources from "../../resources/test-resources"
import {setSubcaccCertEnvVar} from "../../resources/test-helpers"
import {verifyPrescriptionSignature} from "../../../src/services/verification/signature-verification"
import {
  extractSignatureRootFromParentPrescription,
  extractSignatureDateTimeStamp
} from "../../../src/services/verification/common"
import {clone} from "../../resources/test-helpers"
import {hl7V3} from "@models"
import pino from "pino"
import {X509Certificate} from "crypto"
import path from "path"
import fs from "fs"

const logger = pino()

describe("verifyPrescriptionSignature", () => {
  beforeAll(() => {
    process.env.SUBCACC_CERT = ""
    setSubcaccCertEnvVar("../resources/certificates/subCA-dummy.crt")
  })

  describe("Invalid signature format", () => {
    const validSignature = TestResources.parentPrescriptions.validSignature.ParentPrescription
    test("passes if prescriptions signature has valid fields", async () => {
      const result = await verifyPrescriptionSignature(validSignature, logger)
      console.log("result =", result )

      expect(result).not.toContain("Invalid signature format")
    })

    test("fails if prescriptions signature doesn't have signedInfo", async () => {
      const clonePrescription = clone(validSignature)
      const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
      delete signatureRoot.Signature.SignedInfo
      const result = await verifyPrescriptionSignature(clonePrescription, logger)
      expect(result).toContain("Invalid signature format")
    })

    test("fails if prescriptions signature doesn't have signatureValue", async () => {
      const clonePrescription = clone(validSignature)
      const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
      delete signatureRoot.Signature.SignatureValue._text
      const result = await verifyPrescriptionSignature(clonePrescription, logger)
      expect(result).toContain("Invalid signature format")
    })

    test("fails if prescriptions signature doesn't have X509Cert", async () => {
      const clonePrescription = clone(validSignature)
      const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
      delete signatureRoot.Signature.KeyInfo.X509Data.X509Certificate._text
      const result = await verifyPrescriptionSignature(clonePrescription, logger)
      expect(result).toContain("Invalid signature format")
    })

    test("fails if prescriptions signature has multiple X509Cert", async () => {
      const clonePrescription = clone(validSignature)
      const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
      const currentSignature = signatureRoot.Signature.KeyInfo.X509Data.X509Certificate._text
      signatureRoot.Signature.KeyInfo.X509Data.X509Certificate._text =
        currentSignature +
        "\n-----END CERTIFICATE-----\n-----BEGIN CERTIFICATE-----\n" +
        currentSignature
      const result = await verifyPrescriptionSignature(clonePrescription, logger)
      expect(result).toContain("Multiple certificates detected")
    })
  })

  describe("Invalid certificate", () => {
    const validSignature = TestResources.parentPrescriptions.validSignature.ParentPrescription
    test("passes if prescriptions signature has valid fields", async () => {
      const result = await verifyPrescriptionSignature(validSignature, logger)
      expect(result).not.toContain("Invalid certificate")
    })

    test("fails if prescriptions signature doesn't have signedInfo", async () => {
      const clonePrescription = clone(validSignature)
      const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
      signatureRoot.Signature.KeyInfo.X509Data.X509Certificate._text = "invalid"
      const result = await verifyPrescriptionSignature(clonePrescription, logger)
      expect(result).toContain("Invalid certificate")
    })

    test("logs error when parsing certificate", async () => {
      const warn = jest.spyOn(logger, "warn")
      const clonePrescription = clone(validSignature)
      const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
      signatureRoot.Signature.KeyInfo.X509Data.X509Certificate._text = "invalid"
      await verifyPrescriptionSignature(clonePrescription, logger)
      expect(warn).toHaveBeenCalledWith(expect.anything(), "Could not parse X509 certificate")
    })
  })

  describe("Signature doesn't match prescription", () => {
    const validSignature = TestResources.parentPrescriptions.validSignature.ParentPrescription

    test("passes if prescription has digest that matches prescription", async () => {
      const result = await verifyPrescriptionSignature(validSignature, logger)
      expect(result).not.toContain("Signature doesn't match prescription")
    })

    test("fails if prescription has digest that doesn't match prescription", async () => {
      const clonePrescription = clone(validSignature)
      const author = clonePrescription.pertinentInformation1.pertinentPrescription.author
      author.AgentPerson.agentPerson.name._text = "different"
      const result = await verifyPrescriptionSignature(clonePrescription, logger)
      expect(result).toContain("Signature doesn't match prescription")
    })
  })

  describe("Signature is invalid", () => {
    const validSignature = TestResources.parentPrescriptions.validSignature.ParentPrescription
    const valid256Signature = TestResources.parentPrescriptions.sha256Signature.ParentPrescription

    test("passes if prescription has valid Signature that matches prescription", async () => {
      const result = await verifyPrescriptionSignature(validSignature, logger)
      expect(result).not.toContain("Signature is invalid")
    })

    test("passes if prescription signature method algorithm that references SHA-256 matches prescription", async () => {
      const result = await verifyPrescriptionSignature(valid256Signature, logger)
      expect(result).not.toContain("Signature is invalid")
    }, 10000)

    test("passes if prescription signature is valid but method algorithm does not reference SHA-256 or SHA-1",
      async () => {
        const clonePrescription = clone(validSignature)
        const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
        signatureRoot.Signature.SignedInfo.SignatureMethod._attributes.Algorithm =
        "http://www.w3.org/2000/09/xmldsig#"
        signatureRoot.Signature.SignedInfo.Reference.DigestMethod._attributes.Algorithm =
        "http://www.w3.org/2000/09/xmldsig#"
        const result = await verifyPrescriptionSignature(clonePrescription, logger)
        expect(result).not.toContain("Signature is invalid")
      })

    test("fails if prescription signature is valid but method algorithm references incorrect encoding",
      async () => {
        const clonePrescription = clone(validSignature)
        const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
        signatureRoot.Signature.SignedInfo.SignatureMethod._attributes.Algorithm =
        "http://www.w3.org/2000/09/xmldsig#rsa-sha224"
        signatureRoot.Signature.SignedInfo.Reference.DigestMethod._attributes.Algorithm =
        "http://www.w3.org/2000/09/xmldsig#sha224"
        const result = await verifyPrescriptionSignature(clonePrescription, logger)
        expect(result).toContain("Signature is invalid")
      })

    test("fails if prescription has invalid Signature", async () => {
      const clonePrescription = clone(validSignature)
      const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
      signatureRoot.Signature.SignatureValue._text = "invalid"
      const result = await verifyPrescriptionSignature(clonePrescription, logger)
      expect(result).toContain("Signature is invalid")
    })
  })

  describe("Certificate expired when signed", () => {
    const parentPrescription = TestResources.parentPrescriptions.validSignature.ParentPrescription
    test("fails when signature date is before cert start date", async () => {
      setSignatureTimeStamp(parentPrescription, "20210707120522")
      const result = await verifyPrescriptionSignature(parentPrescription, logger)
      expect(result).toContain("Certificate expired when signed")
    })
    test("fails when signature date is after cert end date", async () => {
      setSignatureTimeStamp(parentPrescription, "202307120522")
      const result = await verifyPrescriptionSignature(parentPrescription, logger)
      expect(result).toContain("Certificate expired when signed")
    })
    test("passes if cert had not expired when signature created", async () => {
      setSignatureTimeStamp(parentPrescription, "20210824120522")
      const result = await verifyPrescriptionSignature(parentPrescription, logger)
      expect(result).not.toContain("Certificate expired when signed")
    })
  })

  describe("Certificate not trusted", () => {
    const validSignature = TestResources.parentPrescriptions.validSignature.ParentPrescription
    const getX509Cert = (certPath: string): X509Certificate => {
      const cert = fs.readFileSync(path.join(__dirname, certPath))
      return new X509Certificate(cert)
    }

    test("fails when cert is not issued by SubCAcc", async () => {
      const unTrustedCert = getX509Cert("../../resources/certificates/x509-not-trusted-dummy.cer")
      const clonePrescription = clone(validSignature)
      const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
      signatureRoot.Signature.KeyInfo.X509Data.X509Certificate._text = unTrustedCert.raw.toString("base64")
      const result = await verifyPrescriptionSignature(clonePrescription, logger)
      expect(result).toContain("Certificate not trusted")
    })
    test("passes when cert is issued by SubCAcc", async () => {
      const trustedCert = getX509Cert("../../resources/certificates/x509-trusted-dummy-cert.crt")
      const clonePrescription = clone(validSignature)
      const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
      signatureRoot.Signature.KeyInfo.X509Data.X509Certificate._text = trustedCert.raw.toString("base64")
      const result = await verifyPrescriptionSignature(clonePrescription, logger)
      expect(result).not.toContain("Certificate not trusted")
    })
    test("should return true when 1 of many SubCa's are trusted", async () => {
      setSubcaccCertEnvVar("../resources/certificates/x509-not-trusted-dummy.cer")
      const trustedCert = getX509Cert("../../resources/certificates/x509-trusted-dummy-cert.crt")
      const clonePrescription = clone(validSignature)
      const signatureRoot = extractSignatureRootFromParentPrescription(clonePrescription)
      signatureRoot.Signature.KeyInfo.X509Data.X509Certificate._text = trustedCert.raw.toString("base64")
      const result = await verifyPrescriptionSignature(clonePrescription, logger)
      expect(result).not.toContain("Certificate not trusted")
    })
  })
})

describe("extractSignatureDateTime", () => {
  const parentPrescription = TestResources.parentPrescriptions.validSignature.ParentPrescription
  test("should returns signature timeStamp from prescription", () => {
    const signatureTimeStamp = "20210824100522"
    setSignatureTimeStamp(parentPrescription, signatureTimeStamp)
    const result = extractSignatureDateTimeStamp(parentPrescription)
    const expected = new hl7V3.Timestamp(signatureTimeStamp)
    expect(result).toEqual(expected)
  })
})

const setSignatureTimeStamp = (parentPrescription: hl7V3.ParentPrescription, timeStamp: string): void => {
  parentPrescription
    .pertinentInformation1
    .pertinentPrescription
    .author
    .time
    ._attributes
    .value = timeStamp
}
