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

      console.log( "result ", result )

      expect(result).not.toContain("Invalid signature format")
    })
  })

  describe("Signature doesn't match prescription", () => {
    const validSignature = TestResources.parentPrescriptions.jceSignature.ParentPrescription

    test("passes if prescription has digest that matches prescription", async () => {
      const result = await verifyPrescriptionSignature(validSignature, logger)
      console.log( "result ", result )

      expect(result).not.toContain("Signature doesn't match prescription")
    })
  })

})
