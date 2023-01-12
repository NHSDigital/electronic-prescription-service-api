import pino from "pino"
import {CertificateRevocationList} from "pkijs"
import * as TestPrescriptions from "../../resources/test-resources"
import * as TestCertificates from "../../resources/certificates/test-resources"
import {getRevocationList} from "../../../src/services/verification/certificate-revocation/utils"
import {getRevokedCertReasonCode} from "../../../src/services/verification/certificate-revocation/utils"
import {isSignatureCertificateValid} from "../../../src/services/verification/certificate-revocation"
import {CRLReasonCode} from "../../../src/services/verification/certificate-revocation/crl-reason-code"

const logger = pino()

jest.mock("../../../src/services/verification/certificate-revocation/utils", () => {
  const actual = jest.requireActual("../../../src/services/verification/certificate-revocation/utils")
  return {
    ...actual,
    getX509SerialNumber: function () {
      return "5dc9a8a8" //serial number exists in CRL on invalidSignature in parentPrescriptions
    }
  }
})

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

describe("getRevocationList...", () => {
  test("returns a CRL containing one or more certificates", async () => {
    const list: CertificateRevocationList = await getRevocationList("http://crl.nhs.uk/int/1d/crlc2.crl")
    expect(list.revokedCertificates.length).toBeGreaterThan(0)
  })
})
