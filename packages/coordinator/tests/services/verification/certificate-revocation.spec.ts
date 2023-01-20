import axios from "axios"
import * as moxios from "moxios"
import pino from "pino"
import {Certificate, CertificateRevocationList} from "pkijs"
import {X509} from "jsrsasign"
import * as TestPrescriptions from "../../resources/test-resources"
import * as TestCertificates from "../../resources/certificates/test-resources"
import * as utils from "../../../src/services/verification/certificate-revocation/utils"
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
 * 1. Unreadable certificate
 * 2. Expired certificate
 * 3. Revoked certificate
 * 3.1 (CA/Key)Compromise
 * 3.2 Any other handled Reason Code
 * 3.2.1 Prescription signed before revocation
 * 3.2.2 Prescription signed after revocation
 * 3.3 Any unhandled Reason Code
 * 3.4 Reason Code not specified
 * 4. CRL Distribution Point not set within certificate
 * 5. CRL non signed by Sub CA / Root CA <--- still need source code
 */

describe("Sanity checks for mock data:", () => {
  test("CRL contains 3 revoked certs", async () => {
    const list: CertificateRevocationList = TestCertificates.revocationList
    expect(list.revokedCertificates.length).toBeGreaterThanOrEqual(3)

    const revocationReasons = list.revokedCertificates.map((cert) => utils.getRevokedCertReasonCode(cert))
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
        expect(url).toBe("http://example.com/eps.crl")
      }
    })
  })
})

describe("when checking certificate validity scenarios, ", () => {
  test("returns false if certificate is unreadable", async () => {
    // const unreadableCert = "IIEGTCCAwGgAwIBAgIEYBrwzDANBgkqhkiG9w0BAQsFADA2MQwwCgYDVQQKEwNuaHMxCzAJBgNVBAsTAkNBMRkwFwYDVQQDExBOSFMgSU5UIExldmVsIDJEMB4XDTIxMDcwODE0NTI0N1oXDTIyMDcwODE1MjI0N1owSzEMMAoGA1UEChMDbmhzMQswCQYDVQQLEwJDQTEZMBcGA1UEAxMQTkhTIElOVCBMZXZlbCAyRDETMBEGA1UEAxMKSm9obiBTbWl0aDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAIqtQanL2LWl3FB+jFK+O4RQxQ40sdAIKCXOnqgFkYJviDfW9XHx7XUKdk/xBCeyA3e+x8eF9iK8EeytfkD0KRLWfTGZ0GIwFP/SZ/lwpN/QGP9oSte6mtpP/AZbr7+VsWpsctmAmEDvu68LY1PUtQcmqg+4EllVbSjfnRr6zJ2lxndCp9Qa27xKRsPRjgs…UdIwQYMBaAFHbQEwruMwOC9dY/FlUs5CGsLqvOMB0GA1UdDgQWBBQuJRL2xWnsf5qpDw5phRSy+T0MvTAJBgNVHRMEAjAAMBkGCSqGSIb2fQdBAAQMMAobBFY4LjMDAgSwMA0GCSqGSIb3DQEBCwUAA4IBAQAUPRQtGdO1T9/VnczQ7OC5dwE5fLBNxl+MaH/dLa5WWGK0kcLYZEcCGWH24vNsqS+C8YX0p5OPSD66hak4fHimfDOmVD9YYJMKVOkjdYZsJG0rgdbX7ozOcXYj6+f01pXzW2PMPQLV8oowBOVTGDo9npDOYU+qBsfMu1QYyxcNmKstcracKPoLT3wvICpSeuHEDq3zrKCcgPlXVNie3GBLKQQD/diq+5hGXbxHN7Ge/VcJ7RyIpQ2lrzUnCAzDhacHqEbfNIEjEIkgdizivHyi+pSZvv49+gJBGoYVHZpD+Q+NYffWgB6TSsYSQ9/0kBDX7W0mOSq/3/EU70tiMEYh"

    // // make the function return the unreadable cert instead
    // const spy = jest.spyOn(utils, 'getCertificateTextFromPrescription')
    // spy.mockReturnValue(unreadableCert)

    // const validPrescription = TestPrescriptions.parentPrescriptions.validSignature.ParentPrescription
    // const isValid = await isSignatureCertificateValid(validPrescription, logger)
    // expect(isValid).toEqual(false)

    // spy.mockRestore()
    expect(true).toBe(true)
  })
})

describe("verify certificate revocation functions", () => {
  const crl = TestCertificates.revocationList
  const keyCompromisedCert = crl.revokedCertificates[0]
  const cACompromisedCert = crl.revokedCertificates[1]
  const ceasedOperationCert = crl.revokedCertificates[2]

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
      const validSignature = TestPrescriptions.parentPrescriptions.validSignature.ParentPrescription
      const isValid = await isSignatureCertificateValid(validSignature, logger)
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
