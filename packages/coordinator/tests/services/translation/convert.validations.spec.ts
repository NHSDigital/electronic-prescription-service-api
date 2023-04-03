import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"
import {convert} from "../../convert"

import validator from "xsd-schema-validator"
import * as xml from "../../../src/services/serialisation/xml"

describe("Validation tests:", () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2022, 1, 1))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test.each([TestResources.convertSuccessDispenseExamples[0]])(
    "%s message should validate against DispenseNotification BSA schema.",
    async (testname: string, request: fhir.Resource) => {

      const dispenseNotificationSchemaPath = TestResources.dispensingValidationSchema.DispenseNotification
      const result = await convert(request)

      console.log(xml.writeXmlStringPretty(xml.readXml(result.message)))

      let valid: boolean
      validator.validateXML(result.message, dispenseNotificationSchemaPath, (err, result) => {
        expect(err).not.toBeDefined()
        expect(result.valid).toBeTruthy()
        valid = result.valid
      })

      expect(valid).toBeTruthy()
    }
  )

  test.each([TestResources.convertSuccessClaimExamples[0]])(
    "%s message should validate against Claim BSA schema.",
    async (testname: string, request: fhir.Resource) => {

      const claimSchemaPath = TestResources.dispensingValidationSchema.Claim
      const result = await convert(request)

      console.log(xml.writeXmlStringPretty(xml.readXml(result.message)))

      let valid: boolean
      validator.validateXML(result.message, claimSchemaPath, (err, result) => {
        expect(err).not.toBeDefined()
        expect(result.valid).toBeTruthy()
        valid = result.valid
      })

      expect(valid).toBeTruthy()
    }
  )

  test.each([TestResources.convertSuccessClaimExamples[0]])(
    "%s message should validate against Claim BSA schema.",
    async (testname: string, request: fhir.Resource) => {

      const nominatedReleaseSchemaPath = TestResources.dispensingValidationSchema.NominatedRelease
      const patientReleaseSchemaPath = TestResources.dispensingValidationSchema.PatientRelease

      const result = await convert(request)

      console.log(xml.writeXmlStringPretty(xml.readXml(result.message)))

      function validate(schemaPath: string): boolean {
        let valid: boolean
        validator.validateXML(result.message, schemaPath, (err, result) => {
          expect(err).not.toBeDefined()
          expect(result.valid).toBeTruthy()
          valid = result.valid
        })
        return valid
      }

      expect(
        [validate(nominatedReleaseSchemaPath), validate(patientReleaseSchemaPath)].some(v => v)
      ).toBeTruthy()
    }
  )
})
