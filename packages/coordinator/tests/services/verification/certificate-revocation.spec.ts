import axios from "axios"
import * as moxios from "moxios"
import pino from "pino"
import {Certificate, CertificateRevocationList} from "pkijs"
import {mocked} from "ts-jest/utils"
import {X509} from "jsrsasign"
import * as TestPrescriptions from "../../resources/test-resources"
import * as TestCertificates from "../../resources/certificates/test-resources"
import {
  getCertificateFromPrescription,
  getRevokedCertReasonCode,
  isValidCrlDistributionPointUrl,
  wasPrescriptionSignedAfterRevocation
} from "../../../src/services/verification/certificate-revocation/utils"
import {isCertificateRevoked} from "../../../src/services/verification/certificate-revocation/verify"
import {isSignatureCertificateValid} from "../../../src/services/verification/certificate-revocation"
import {CRLReasonCode} from "../../../src/services/verification/certificate-revocation/crl-reason-code"
import {MockCertificates} from "../../resources/certificates/test-resources"

const logger = pino()

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

jest.mock("../../../src/services/verification/certificate-revocation/utils", () => {
  const actual = jest.requireActual("../../../src/services/verification/certificate-revocation/utils")
  return {
    ...actual,
    getCertificateFromPrescription: jest.fn(),
    wasPrescriptionSignedAfterRevocation: jest.fn()
  }
})
const mockGetCertFromPrescription = mocked(getCertificateFromPrescription, true)
const mockedSignedAfterRevocation = mocked(wasPrescriptionSignedAfterRevocation, true)

beforeEach(() => {
  moxios.install(axios)
})

afterEach(() => {
  moxios.uninstall(axios)
})

describe("Sanity checks for mock data:", () => {
  test("CRL contains 3 revoked certs", async () => {
    const list: CertificateRevocationList = TestCertificates.revocationList
    expect(list.revokedCertificates.length).toBeGreaterThanOrEqual(3)

    const revocationReasons = list.revokedCertificates.map((cert) => getRevokedCertReasonCode(cert))
    expect(revocationReasons).toContain(CRLReasonCode.CACompromise)
    expect(revocationReasons).toContain(CRLReasonCode.KeyCompromise)
    expect(revocationReasons).toContain(CRLReasonCode.CessationOfOperation)
  })

  test("certificates have a CRL Distribution Point URL", () => {
    const certs = getAllMockCertificates()
    certs.forEach((cert: Certificate) => {
      const certString = cert.toString()
      const x509Cert = new X509(certString)
      const distributionPointURIs = x509Cert.getExtCRLDistributionPointsURI()

      expect(distributionPointURIs.length).toBe(1)
      for (const url of distributionPointURIs) {
        expect(isValidCrlDistributionPointUrl(url)).toBe(true)
      }
    })
  })
})

describe("isSignatureCertificateValid...", () => {
  test("returns true if certificate has not been revoked", async () => {
    const x509 = TestCertificates.convertCertToX509Cert(TestCertificates.validCertificates.certificate)
    mockGetCertFromPrescription.mockReturnValueOnce(x509)
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith({
        status: 200,
        response: TestCertificates.berRevocationList
      })
    })

    const validSignature = TestPrescriptions.parentPrescriptions.validSignature.ParentPrescription
    const isValid = await isSignatureCertificateValid(validSignature, logger)
    expect(isValid).toEqual(true)
  })

  test("returns false if certificate has been revoked", async () => {
    const x509 = TestCertificates.convertCertToX509Cert(TestCertificates.revokedCertificates.keyCompromise)
    mockGetCertFromPrescription.mockReturnValueOnce(x509)
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith({
        status: 200,
        response: TestCertificates.berRevocationList
      })
    })

    const invalidSignature = TestPrescriptions.parentPrescriptions.invalidSignature.ParentPrescription
    const isValid = await isSignatureCertificateValid(invalidSignature, logger)
    expect(isValid).toEqual(false)
  })
})

describe("isCertificateRevoked...", () => {
  const crl = TestCertificates.revocationList

  test("returns true when cert revoked with 'KeyCompromise'", () => {
    const keyCompromisedCert = crl.revokedCertificates[0]
    const isRevoked = isCertificateRevoked(keyCompromisedCert, new Date(), logger)
    const certRevocationReason = getRevokedCertReasonCode(keyCompromisedCert)

    expect(certRevocationReason).toEqual(CRLReasonCode.KeyCompromise)
    expect(isRevoked).toEqual(true)
  })

  test("returns true when cert revoked with reason 'CACompromise'", () => {
    const cACompromisedCert = crl.revokedCertificates[1]
    const isRevoked = isCertificateRevoked(cACompromisedCert, new Date(), logger)
    const certRevocationReason = getRevokedCertReasonCode(cACompromisedCert)

    expect(certRevocationReason).toEqual(CRLReasonCode.CACompromise)
    expect(isRevoked).toEqual(true)
  })

  test("returns true when cert revoked with 'CessationOfOperation' was signed after smartcard revoked date", () => {
    mockedSignedAfterRevocation.mockReturnValueOnce(true)
    const ceasedOperationCert = crl.revokedCertificates[2]
    const isRevoked = isCertificateRevoked(ceasedOperationCert, new Date(), logger)
    const certRevocationReason = getRevokedCertReasonCode(ceasedOperationCert)

    expect(certRevocationReason).toEqual(CRLReasonCode.CessationOfOperation)
    expect(isRevoked).toEqual(true)
  })

  test("returns false when cert revoked with 'CessationOfOperation' was signed before smartcard revoked date", () => {
    mockedSignedAfterRevocation.mockReturnValueOnce(false)
    const ceasedOperationCert = crl.revokedCertificates[2]
    const isRevoked = isCertificateRevoked(ceasedOperationCert, new Date(), logger)
    const certRevocationReason = getRevokedCertReasonCode(ceasedOperationCert)

    expect(certRevocationReason).toEqual(CRLReasonCode.CessationOfOperation)
    expect(isRevoked).toEqual(false)
  })
})
