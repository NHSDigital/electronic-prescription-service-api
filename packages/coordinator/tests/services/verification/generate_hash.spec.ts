import * as TestResources from "../../resources/test-resources"
import {setSubcaccCertEnvVar} from "../../resources/test-helpers"
import {verifyPrescriptionSignature} from "../../../src/services/verification/signature-verification"
import pino from "pino"

const logger = pino()

describe("verifyPrescriptionSignature", () => {
  beforeAll(() => {
    process.env.SUBCACC_CERT = ""
    setSubcaccCertEnvVar("../resources/certificates/subCA-dummy.crt")
  })

  describe("Generate hash", () => {
    const validSignature = TestResources.parentPrescriptions.generateHashSignature.ParentPrescription

    test("Generate hash", async () => {
      const result = await verifyPrescriptionSignature(validSignature, logger)
      console.log( "result =", result)
      expect(result).not.toContain("Signature doesn't match prescription")
    })
  })

})
