import axios from "axios"
import * as moxios from "moxios"
import pino from "pino"
import {Certificate, CertificateRevocationList} from "pkijs"
import {X509} from "jsrsasign"
import {hl7V3} from "@models"
import * as TestPrescriptions from "../../resources/test-resources"
import * as TestCertificates from "../../resources/certificates/test-resources"
import * as utils from "../../../src/services/verification/certificate-revocation/utils"
import * as common from "../../../src/services/verification/common"
import {isCertificateRevoked} from "../../../src/services/verification/certificate-revocation/verify"
import {isSignatureCertificateValid} from "../../../src/services/verification/certificate-revocation"
import {CRLReasonCode} from "../../../src/services/verification/certificate-revocation/crl-reason-code"
import {MockCertificates} from "../../resources/certificates/test-resources"

const logger = pino()

const crl = TestCertificates.revocationList
const keyCompromisedCert = crl.revokedCertificates[0]
const cACompromisedCert = crl.revokedCertificates[1]
const ceasedOperationCert = crl.revokedCertificates[2]

const getAllMockCertificates = (): Array<Certificate> => {
  const mockCertificateCategories: MockCertificates = {
    ...TestCertificates.revokedCertificates,
    ...TestCertificates.validCertificates
  }

  const certificates: Array<Certificate> = []
  for (const category in mockCertificateCategories) {
    const cert = mockCertificateCategories[category]
    certificates.push(cert)
  }

  return certificates
}

beforeAll(() => {
  moxios.install(axios)
})

afterAll(() => {
  moxios.uninstall(axios)
})

// We always want to use our mock CRL, to avoid relying on external ones
moxios.stubRequest(/http:\/\/.*.crl/, {
  status: 200,
  response: TestCertificates.berRevocationList
})

/**
 * TODO: Test scenarios:
 * 1. Unreadable certificate - done
 * 2. Expired certificate - done
 * 3. Revoked certificate - done
 * 3.1 (CA/Key)Compromise - done
 * 3.2 Any other handled Reason Code - done
 * 3.2.1 Prescription signed before revocation - done
 * 3.2.2 Prescription signed after revocation - done
 * 3.3 Any unhandled Reason Code - done
 * 3.4 Reason Code not specified - done
 * 4. CRL Distribution Point not set within certificate - ?
 * 5. CRL non signed by Sub CA / Root CA <--- still need source code
 */

describe("Sanity check mock data", () => {
  test("CRL contains 3 revoked certs", async () => {
    const list: CertificateRevocationList = TestCertificates.revocationList
    expect(list.revokedCertificates.length).toBeGreaterThanOrEqual(3)

    const revocationReasons = list.revokedCertificates.map((cert) => utils.getRevokedCertReasonCode(cert))
    expect(revocationReasons).toContain(CRLReasonCode.CACompromise)
    expect(revocationReasons).toContain(CRLReasonCode.KeyCompromise)
    expect(revocationReasons).toContain(CRLReasonCode.CessationOfOperation)
  })

  test("Certificates have a CRL Distribution Point URL", () => {
    const certs = getAllMockCertificates()
    certs.forEach((cert: Certificate) => {
      const certString = cert.toString()
      const x509Cert = new X509(certString)
      const distributionPointURIs = x509Cert.getExtCRLDistributionPointsURI()

      expect(distributionPointURIs.length).toBe(1)
      for (const url of distributionPointURIs) {
        expect(url).toBe("http://example.com/eps.crl")
      }
    })
  })
})

describe("Certificate verification edge cases", () => {
  test("prescription should be invalid if certificate is unreadable", async () => {
    const validPrescription = TestPrescriptions.parentPrescriptions.validSignature.ParentPrescription
    const validCertificateText = common.getCertificateTextFromPrescription(validPrescription)
    const unreadableCertText = validCertificateText.slice(1)

    // make the function return the unreadable cert instead
    const certTextSpy = jest.spyOn(common, "getCertificateTextFromPrescription")
    certTextSpy.mockReturnValue(unreadableCertText)

    const isValid = await isSignatureCertificateValid(validPrescription, logger)
    expect(isValid).toEqual(false)

    certTextSpy.mockRestore()
  })

  // Using "invalidSignature" prescription because its cert has a valid CRL Distribution Point
  let prescription: hl7V3.ParentPrescription
  let prescriptionSignedDate = new Date()
  let serialNumberSpy: jest.SpyInstance
  let signedDateSpy: jest.SpyInstance

  beforeAll(() => {
    prescription = TestPrescriptions.parentPrescriptions.invalidSignature.ParentPrescription
  })

  beforeEach(() => {
    // Ensure the function returns a serial that is in our mock CRL
    const revokedCertSerial = utils.getRevokedCertSerialNumber(keyCompromisedCert)
    serialNumberSpy = jest.spyOn(utils, "getX509SerialNumber")
    serialNumberSpy.mockReturnValue(revokedCertSerial)
  })

  afterEach(() => {
    serialNumberSpy.mockRestore()
  })

  describe("prescription is valid if signed before revocation", () => {

    beforeEach(() => {
      // Ensure signed date is one day before revocation
      prescriptionSignedDate = new Date(ceasedOperationCert.revocationDate.value)
      prescriptionSignedDate.setDate(prescriptionSignedDate.getDate() - 1)

      signedDateSpy = jest.spyOn(utils, "getPrescriptionSignatureDate")
      signedDateSpy.mockReturnValue(prescriptionSignedDate)
    })

    afterEach(() => {
      signedDateSpy.mockRestore()
    })

    test("reason code is one we do not handle", async () => {
      // Force an unsupported revocation value to be returned
      const reasonCodeSpy = jest.spyOn(utils, "getRevokedCertReasonCode")
      reasonCodeSpy.mockReturnValue(CRLReasonCode.AACompromise)

      const isValid = await isSignatureCertificateValid(prescription, logger)
      expect(isValid).toEqual(true)

      reasonCodeSpy.mockRestore()
    })

    test("reason code is not specified", async () => {
      // force revocation value to be unspecified
      const reasonCodeSpy = jest.spyOn(utils, "getRevokedCertReasonCode")
      reasonCodeSpy.mockReturnValue(null)

      const isValid = await isSignatureCertificateValid(prescription, logger)
      expect(isValid).toEqual(true)

      reasonCodeSpy.mockRestore()
    })
  })

  describe("prescription is invalid if signed after revocation", () => {
    beforeEach(() => {
      // Ensure signed date is on the same date/time of revocation
      prescriptionSignedDate = new Date(ceasedOperationCert.revocationDate.value)
      signedDateSpy = jest.spyOn(utils, "getPrescriptionSignatureDate")
      signedDateSpy.mockReturnValue(prescriptionSignedDate)
    })

    afterEach(() => {
      signedDateSpy.mockRestore()
    })

    test("reason code is not one we handle", async () => {
      // Force an unsupported revocation value (-1) to be returned
      const reasonCodeSpy = jest.spyOn(utils, "getRevokedCertReasonCode")
      reasonCodeSpy.mockReturnValue(CRLReasonCode.AACompromise)

      const isValid = await isSignatureCertificateValid(prescription, logger)
      expect(isValid).toEqual(false)

      reasonCodeSpy.mockRestore()
    })

    test("reason code is unspecified", async () => {
      // Force revocation value to be unspecified
      const reasonCodeSpy = jest.spyOn(utils, "getRevokedCertReasonCode")
      reasonCodeSpy.mockReturnValue(null)

      const isValid = await isSignatureCertificateValid(prescription, logger)
      expect(isValid).toEqual(false)

      reasonCodeSpy.mockRestore()
    })
  })
})

describe("verify certificate revocation functions", () => {
  describe("validate test data matches expected", () => {
    test("KeyCompromise", () => {
      const revReason = utils.getRevokedCertReasonCode(keyCompromisedCert)
      expect(revReason).toEqual(CRLReasonCode.KeyCompromise)
    })

    test("CACompromise", () => {
      const revReason = utils.getRevokedCertReasonCode(cACompromisedCert)
      expect(revReason).toEqual(CRLReasonCode.CACompromise)
    })

    test("CACompromise", () => {
      const revReason = utils.getRevokedCertReasonCode(ceasedOperationCert)
      expect(revReason).toEqual(CRLReasonCode.CessationOfOperation)
    })
  })

  describe("isSignatureCertificateValid...", () => {
    test("returns true if certificate has not been revoked", async () => {
      // The cert for this prescription has not been revoked
      const prescription = TestPrescriptions.parentPrescriptions.invalidSignature.ParentPrescription
      const certificate = utils.getCertificateFromPrescription(prescription)
      const serialNumber = utils.getX509SerialNumber(certificate)

      const spy = jest.spyOn(utils, "getX509SerialNumber")
      spy.mockReturnValue(serialNumber)

      const isValid = await isSignatureCertificateValid(prescription, logger)
      expect(isValid).toEqual(true)
    })

    test("returns false if certificate has been revoked", async () => {
      // Ensure the function returns a serial that is in our mock CRL
      const revokedCertSerial = utils.getRevokedCertSerialNumber(keyCompromisedCert)
      const spy = jest.spyOn(utils, "getX509SerialNumber")
      spy.mockReturnValue(revokedCertSerial)

      const invalidSignature = TestPrescriptions.parentPrescriptions.invalidSignature.ParentPrescription
      const isValid = await isSignatureCertificateValid(invalidSignature, logger)
      expect(isValid).toEqual(false)

      spy.mockRestore()
    })
  })

  describe("isCertificateRevoked", () => {

    let prescriptionSignedDate: Date
    beforeEach(() => {
      const revocationDate = keyCompromisedCert.revocationDate.value
      // Setting signing date to 30 days before revocation
      prescriptionSignedDate = new Date()
      prescriptionSignedDate.setDate(revocationDate.getDate() - 30)
    })

    test("returns true when cert revoked with KeyCompromise", () => {
      const isRevoked = isCertificateRevoked(keyCompromisedCert, prescriptionSignedDate, logger)
      expect(isRevoked).toEqual(true)
    })

    test("returns true when cert revoked with reason CACompromise", () => {
      const isRevoked = isCertificateRevoked(cACompromisedCert, prescriptionSignedDate, logger)
      expect(isRevoked).toEqual(true)
    })

    describe("when cert is revoked with CessationOfOperation", () => {
      test("returns false if prescription was signed before revocation", () => {
        // Set signing date to one day before revocation
        prescriptionSignedDate = new Date(ceasedOperationCert.revocationDate.value)
        prescriptionSignedDate.setDate(prescriptionSignedDate.getDate() - 1)

        const isRevoked = isCertificateRevoked(ceasedOperationCert, prescriptionSignedDate, logger)
        expect(isRevoked).toEqual(false)
      })

      test("returns true if prescription was signed after revocation", () => {
        // Set signing date to the same date and time of revocation
        prescriptionSignedDate = new Date(ceasedOperationCert.revocationDate.value)

        const isRevoked = isCertificateRevoked(ceasedOperationCert, prescriptionSignedDate, logger)
        expect(isRevoked).toEqual(true)
      })
    })
  })
})
