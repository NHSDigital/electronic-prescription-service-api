import pino from "pino"
import {CertificateRevocationList} from "pkijs"
import {mocked} from "ts-jest/utils"
import * as TestPrescriptions from "../../resources/test-resources"
import * as TestCertificates from "../../resources/certificates/test-resources"
import {
  getRevocationList,
  getRevokedCertReasonCode,
  wasPrescriptionSignedAfterRevocation
} from "../../../src/services/verification/certificate-revocation/utils"
import {isCertificateRevoked} from "../../../src/services/verification/certificate-revocation/verify"
import {isSignatureCertificateValid} from "../../../src/services/verification/certificate-revocation"
import {CRLReasonCode} from "../../../src/services/verification/certificate-revocation/crl-reason-code"

const logger = pino()

jest.mock("../../../src/services/verification/certificate-revocation/utils", () => {
  const actual = jest.requireActual("../../../src/services/verification/certificate-revocation/utils")
  return {
    ...actual,
    getX509SerialNumber: function () {
      return "5dc9a8a8" //serial number exists in CRL on invalidSignature in parentPrescriptions
    },
    wasPrescriptionSignedAfterRevocation: jest.fn()
  }
})
const mockedSignedAfterRevocation = mocked(wasPrescriptionSignedAfterRevocation, true)

describe("Mock data is read correctly...", () => {
  describe("CRL", () => {
    const list: CertificateRevocationList = TestCertificates.revocationList

    test("contains 3 revoked certs", async () => {
      expect(list.revokedCertificates.length).toBeGreaterThanOrEqual(3)

      const revocationReasons = list.revokedCertificates.map((cert) => getRevokedCertReasonCode(cert))
      expect(revocationReasons).toContain(CRLReasonCode.CACompromise)
      expect(revocationReasons).toContain(CRLReasonCode.KeyCompromise)
      expect(revocationReasons).toContain(CRLReasonCode.CessationOfOperation)
    })
  })
})

describe("isSignatureCertificateValid...", () => {
  test("returns true if certificate has not been revoked", async () => {
    const validSignature = TestPrescriptions.parentPrescriptions.validSignature.ParentPrescription
    const revoked = await isSignatureCertificateValid(validSignature, logger)
    expect(revoked).toEqual(true)
  })

  test("returns false if certificate has been revoked", async () => {
    const invalidSignature = TestPrescriptions.parentPrescriptions.invalidSignature.ParentPrescription
    const revoked = await isSignatureCertificateValid(invalidSignature, logger)
    expect(revoked).toEqual(false)
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

describe("getRevocationList...", () => {
  test("returns a CRL containing one or more certificates", async () => {
    const list: CertificateRevocationList = await getRevocationList("http://crl.nhs.uk/int/1d/crlc2.crl")
    expect(list.revokedCertificates.length).toBeGreaterThan(0)
  })
})
