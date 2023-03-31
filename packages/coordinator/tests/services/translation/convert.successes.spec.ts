import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"
import {convert} from "../../convert"

import validator from "xsd-schema-validator"
import * as xml from "../../../src/services/serialisation/xml"

describe("conversion tests", () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2022, 1, 1))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test.each(TestResources.convertSuccessExamples)(
    "should be able to convert %s message to HL7V3",
    async (testname: string, request: fhir.Resource, response: string, responseMatcher: string) => {
      const regex = new RegExp(responseMatcher)
      expect(response).toMatch(regex)
      const result = await convert(request)
      expect(result.message).toMatch(regex)
    }
  )
})

describe("Validation tests:", () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2022, 1, 1))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test.each([TestResources.convertSuccessDispenseExamples[0]])(
    "%s message should validate against BSA schema.",
    async (testname: string, request: fhir.Resource) => {
      const dispenseNotficationSchemaPath = "packages/coordinator/tests/services/translation/schema/Notification.xsd"
      const result = await convert(request)

      console.log(xml.writeXmlStringPretty(xml.readXml(result.message)))

      let valid: boolean
      validator.validateXML(result.message, dispenseNotficationSchemaPath, (err, result) => {
        expect(err).not.toBeDefined()
        expect(result.valid).toBeTruthy()
        valid = result.valid
      })

      expect(valid).toBeTruthy()
    }
  )
})
