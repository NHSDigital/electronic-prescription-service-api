import * as TestResources from "../../resources/test-resources"
import validator from "xsd-schema-validator"

describe("Validation tests:", () => {
  test.each(TestResources.convertSuccessClaimExamples)(
    "%s message should validate against Claim BSA schema.",
    async (testname: string, response: string) => {
      const schemaPath = TestResources.dispensingValidationSchema.Claim

      const result = await validator.validateXML(response, schemaPath)

      expect(result.valid).toBeTruthy()
    }
  )

  test.each(TestResources.convertSuccessDispenseExamples)(
    "%s message should validate against DispenseNotification BSA schema.",
    async (testname: string, response: string) => {
      const schemaPath = TestResources.dispensingValidationSchema.DispenseNotification

      const result = await validator.validateXML(response, schemaPath)

      expect(result.valid).toBeTruthy()
    }
  )

  test.each(TestResources.convertSuccessReleaseExamples)(
    "%s message should validate against PatientRelease BSA schema.",
    async (testname: string, response: string) => {
      const schemaPath = TestResources.dispensingValidationSchema.PatientRelease

      const result = await validator.validateXML(response, schemaPath)

      expect(result.valid).toBeTruthy()
    }
  )

  test.each(TestResources.convertSuccessReturnExamples)(
    "%s message should validate against Return BSA schema.",
    async (testname: string, response: string) => {
      const schemaPath = TestResources.dispensingValidationSchema.Return

      const result = await validator.validateXML(response, schemaPath)

      expect(result.valid).toBeTruthy()
    }
  )

  test.each(TestResources.convertSuccessWithdrawExamples)(
    "%s message should validate against Withdraw BSA schema.",
    async (testname: string, response: string) => {
      const schemaPath = TestResources.dispensingValidationSchema.Withdraw

      const result = await validator.validateXML(response, schemaPath)

      expect(result.valid).toBeTruthy()
    }
  )
})
