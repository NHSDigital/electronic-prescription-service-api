import * as TestResources from "../../resources/test-resources"
import {setSubcaccCertEnvVar} from "../../resources/test-helpers"
import {
  verifyPrescriptionSignatureValid,
  verifySignatureDigestMatchesPrescription,
  verifySignatureHasCorrectFormat,
  verifyCertificate,
  verifyChain,
  verifyCertificateValidWhenSigned,
  verifyPrescriptionSignature
} from "../../../src/services/verification/signature-verification"
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

describe("Verification of cert and signature", () => {
  beforeAll(() => {
    setSubcaccCertEnvVar("../resources/certificates/subCA-dummy.crt")
  })

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

    test("returns Signature doesn't match prescription", () => {
      const result = verifyPrescriptionSignature(nonMatchingSignature, logger)
      expect(result).toContain("Signature doesn't match prescription")
    })

    test("returns Signature is invalid", () => {
      const result = verifyPrescriptionSignature(nonMatchingSignature, logger)
      expect(result).toContain("Signature is invalid")
    })
    test("returns Signature match prescription", () => {
      const result = verifyPrescriptionSignature(validSignature, logger)
      expect(result).not.toContain("Signature doesn't match prescription")
      expect(result).not.toContain("Signature is invalid")
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

  describe("verifyCertificate", () => {
    const parentPrescription = TestResources.parentPrescriptions.validSignature.ParentPrescription
    const certExpiredErrorMessage = "Certificate expired when signed"
    test("should return certExpiredErrorMessage when cert expired when signature created", () => {
      setSignatureTimeStamp(parentPrescription, "20210707120522")
      const result = verifyCertificate(parentPrescription)
      const certificateHasExpired = result.includes(certExpiredErrorMessage)
      expect(certificateHasExpired).toBeTruthy()
    })
    test("should not return error message when cert has not expired", () => {
      setSignatureTimeStamp(parentPrescription, "20210824120522")
      const result = verifyCertificate(parentPrescription)
      const certificateHasExpired = result.includes(certExpiredErrorMessage)
      expect(certificateHasExpired).toBeFalsy()
    })
    test("should not return error message when cert has not expired", () => {
      const result = verifyCertificate(parentPrescription)
      const certificateHasExpired = result.includes(certExpiredErrorMessage)
      expect(certificateHasExpired).toBeFalsy()
    })
  })

  describe("VerifyChain", () => {
    const getX509Cert = (certPath: string): X509Certificate => {
      const cert = fs.readFileSync(path.join(__dirname, certPath))
      return new X509Certificate(cert)
    }

    test("should return false when cert is not issued by SubCAcc", () => {
      const unTrustedCert = getX509Cert("../../resources/certificates/x509-not-trusted-dummy.cer")
      const result = verifyChain(unTrustedCert)
      expect(result).toEqual(false)
    })
    test("should return true when cert is issued by SubCAcc", () => {
      const trustedCert = getX509Cert("../../resources/certificates/x509-trusted-dummy-cert.crt")
      const result = verifyChain(trustedCert)
      expect(result).toEqual(true)
    })
    test("should return true when 1 of many SubCa's are trusted", () => {
      setSubcaccCertEnvVar("../resources/certificates/x509-not-trusted-dummy.cer")
      const trustedCert = getX509Cert("../../resources/certificates/x509-trusted-dummy-cert.crt")
      const result = verifyChain(trustedCert)
      expect(result).toEqual(true)
    })
  })

  describe("verifyCertificateValidWhenSigned ", () => {
    const parentPrescription = TestResources.parentPrescriptions.validSignature.ParentPrescription
    test("should return false when signature date is before cert start date", () => {
      setSignatureTimeStamp(parentPrescription, "20210707120522")
      const result = verifyCertificateValidWhenSigned(parentPrescription)
      expect(result).toBeFalsy()
    })
    test("should return false when signature date is after cert end date", () => {
      setSignatureTimeStamp(parentPrescription, "202307120522")
      const result = verifyCertificateValidWhenSigned(parentPrescription)
      expect(result).toBeFalsy()
    })
    test("should return true when signature date is after cert start date and before cert end date", () => {
      setSignatureTimeStamp(parentPrescription, "20210824120522")
      const result = verifyCertificateValidWhenSigned(parentPrescription)
      expect(result).toBeTruthy()
    })
  })

  describe("verifyPrescriptionSignature", () => {
    const parentPrescription = TestResources.parentPrescriptions.validSignature.ParentPrescription
    const certExpiredErrorMessage = "Certificate expired when signed"

    test("should return error message when verifyCertificate has errors", () => {
      setSignatureTimeStamp(parentPrescription, "20210707120522")
      const result = verifyPrescriptionSignature(parentPrescription, logger)
      const certificateHasExpired = result.includes(certExpiredErrorMessage)
      expect(certificateHasExpired).toBeTruthy()
    })
    test("should not return error message when cert has not expired", () => {
      setSignatureTimeStamp(parentPrescription, "20210824120522")
      const result = verifyPrescriptionSignature(parentPrescription, logger)
      const certificateHasExpired = result.includes(certExpiredErrorMessage)
      expect(certificateHasExpired).toBeFalsy()
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

  test("returns Signature doesn't match prescription", async () => {
    const result = await verifyPrescriptionSignature(nonMatchingSignature, logger)
    expect(result).toContain("Signature doesn't match prescription")
  })

  test("returns Signature is invalid", async () => {
    const result = await verifyPrescriptionSignature(nonMatchingSignature, logger)
    expect(result).toContain("Signature is invalid")
  })

  test("returns Signature match prescription", async () => {
    const result = await verifyPrescriptionSignature(validSignature, logger)
    expect(result).not.toContain("Signature doesn't match prescription")
    expect(result).not.toContain("Signature is invalid")
  })
})

describe("verifyPrescriptionSignatureValid...", () => {
  const validSignature = TestResources.parentPrescriptions.validSignature.ParentPrescription
  const invalidSignature = TestResources.parentPrescriptions.invalidSignature.ParentPrescription

  test("Prescription with valid Signature that matches prescription returns true", async () => {
    const result = await verifyPrescriptionSignatureValid(validSignature)
    expect(result).toEqual(true)
  })

  test("Prescription with invalid Signature that doesn't matches prescription returns false", async () => {
    const result = await verifyPrescriptionSignatureValid(invalidSignature)
    expect(result).toEqual(false)
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

describe("verifyCertificate", () => {
  const parentPrescription = TestResources.parentPrescriptions.validSignature.ParentPrescription
  const certExpiredErrorMessage = "Certificate expired when signed"
  test("should return error message when cert was expired when signature was created", () => {
    setSignatureTimeStamp(parentPrescription, "20210707120522")
    const result = verifyCertificate(parentPrescription)
    const certificateHasExpired = result.includes(certExpiredErrorMessage)
    expect(certificateHasExpired).toBeTruthy()
  })
  test("should not return error message when cert has not expired", () => {
    setSignatureTimeStamp(parentPrescription, "20210824120522")
    const result = verifyCertificate(parentPrescription)
    const certificateHasExpired = result.includes(certExpiredErrorMessage)
    expect(certificateHasExpired).toBeFalsy()
  })
})

describe("verifyCertificateValidWhenSigned ", () => {
  const parentPrescription = TestResources.parentPrescriptions.validSignature.ParentPrescription
  test("should return false when signature date is before cert start date", () => {
    setSignatureTimeStamp(parentPrescription, "20210707120522")
    const result = verifyCertificateValidWhenSigned(parentPrescription)
    expect(result).toBeFalsy()
  })
  test("should return false when signature date is after cert end date", () => {
    setSignatureTimeStamp(parentPrescription, "202307120522")
    const result = verifyCertificateValidWhenSigned(parentPrescription)
    expect(result).toBeFalsy()
  })
  test("should return true when signature date is after cert start date and before cert end date", () => {
    setSignatureTimeStamp(parentPrescription, "20210824120522")
    const result = verifyCertificateValidWhenSigned(parentPrescription)
    expect(result).toBeTruthy()
  })
})

describe("verifyPrescriptionSignature", () => {
  const parentPrescription = TestResources.parentPrescriptions.validSignature.ParentPrescription
  const certExpiredErrorMessage = "Certificate expired when signed"

  test("should return error message when verifyCertificate has errors", async () => {
    setSignatureTimeStamp(parentPrescription, "20210707120522")
    const result = await verifyPrescriptionSignature(parentPrescription, logger)
    const certificateHasExpired = result.includes(certExpiredErrorMessage)
    expect(certificateHasExpired).toBeTruthy()
  })
  test("should not return error message when cert has not expired", async () => {
    setSignatureTimeStamp(parentPrescription, "20210824120522")
    const result = await verifyPrescriptionSignature(parentPrescription, logger)
    const certificateHasExpired = result.includes(certExpiredErrorMessage)
    expect(certificateHasExpired).toBeFalsy()
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
