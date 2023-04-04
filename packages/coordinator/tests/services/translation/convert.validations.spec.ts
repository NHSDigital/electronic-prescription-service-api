import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"
import {convert} from "../../convert"

import validator from "xsd-schema-validator"
import * as xml from "../../../src/services/serialisation/xml"

function validate(xmlString: string, schemaPath: string, printXml=false): boolean {
  if (printXml) {
    console.log(xml.writeXmlStringPretty(xml.readXml(xmlString)))
  }
  let isValid: boolean
  validator.validateXML(xmlString, schemaPath, (err, result) => {
    expect(err).not.toBeDefined()
    expect(result.valid).toBeTruthy()
    isValid = result.valid
  })
  return isValid
}

describe("Validation tests:", () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2022, 1, 1))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test.each([TestResources.convertSuccessClaimExamples[0]])(
    "%s message should validate against Claim BSA schema.",
    async (testname: string, request: fhir.Resource) => {
      const result = await convert(request)
      console.log(xml.writeXmlStringPretty(xml.readXml(result.message)))

      const schemaPath = TestResources.dispensingValidationSchema.Claim
      const isValid = validate(result.message, schemaPath)

      expect(isValid).toBeTruthy()
    }
  )

  test.each([TestResources.convertSuccessDispenseExamples[0]])(
    "%s message should validate against DispenseNotification BSA schema.",
    async (testname: string, request: fhir.Resource) => {
      const result = await convert(request)

      const schemaPath = TestResources.dispensingValidationSchema.DispenseNotification
      const isValid = validate(result.message, schemaPath)

      expect(isValid).toBeTruthy()
    }
  )

  test.each([TestResources.convertSuccessReleaseExamples[0]])(
    "%s message should validate against Release BSA schema.",
    async (testname: string, request: fhir.Resource) => {
      const result = await convert(request)

      const nominatedSchemaPath = TestResources.dispensingValidationSchema.NominatedRelease
      const patientSchemaPath = TestResources.dispensingValidationSchema.PatientRelease
      expect(
        [
          validate(result.message, nominatedSchemaPath),
          validate(result.message, patientSchemaPath)
        ].some((v) => v)
      ).toBeTruthy()
    }
  )

  test.each([TestResources.convertSuccessReturnExamples[0]])(
    "%s message should validate against Return BSA schema.",
    async (testname: string, request: fhir.Resource) => {
      const result = await convert(request)

      const schemaPath = TestResources.dispensingValidationSchema.Return
      const isValid = validate(result.message, schemaPath)

      expect(isValid).toBeTruthy()
    }
  )

  test.each([TestResources.convertSuccessWithdrawExamples[0]])(
    "%s message should validate against Withdraw BSA schema.",
    async (testname: string, request: fhir.Resource) => {
      const result = await convert(request)

      const schemaPath = TestResources.dispensingValidationSchema.Withdraw
      const isValid = validate(result.message, schemaPath)

      expect(isValid).toBeTruthy()
    }
  )
})
