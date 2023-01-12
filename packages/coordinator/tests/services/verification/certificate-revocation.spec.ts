import pino from "pino"
import {CertificateRevocationList} from "pkijs"
import * as TestResources from "../../resources/test-resources"
import {isSignatureCertificateValid} from "../../../src/services/verification/signature-certificate"
import {getRevocationList} from "../../../src/services/verification/signature-certificate/utils"

const logger = pino()

describe("isSignatureCertificateValid...", () => {
  test("returns true if certificate has not been revoked", async () => {
    const validSignature = TestResources.parentPrescriptions.validSignature.ParentPrescription
    const revoked = await isSignatureCertificateValid(validSignature, logger)
    expect(revoked).toEqual(true)
  })

  test("returns false if certificate has been revoked", async () => {
    const invalidSignature = TestResources.parentPrescriptions.invalidSignature.ParentPrescription
    const revoked = await isSignatureCertificateValid(invalidSignature, logger)
    expect(revoked).toEqual(false)
  })
})

describe("getRevocationList...", () => {
  let list: CertificateRevocationList
  test("returns a CRL containing one or more certificates", async () => {
    list = await getRevocationList("http://crl.nhs.uk/int/1d/crlc2.crl")
    expect(list.revokedCertificates.length).toBeGreaterThan(0)
  })
})
