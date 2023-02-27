import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"
import {convert} from "../../convert"

describe("conversion tests", () => {
  beforeAll(() => {
    jest.useFakeTimers("modern")
    jest.setSystemTime(new Date(2022, 1, 1))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test.each(TestResources.convertSuccessExamples)(
    "should be able to convert %s message to HL7V3",
    async (testname: string, request: fhir.Resource, response: string, responseMatcher: string) => {
      const regex = new RegExp(responseMatcher)
      const isMatch = regex.test(response)
      expect(isMatch).toBe(true)
      const result = await convert(request)
      const convertMatchesExpectation = regex.test(result.message)
      if (testname.includes(
        "secondary-care homecare acute nominated-pharmacy clinical-practitioner 1 200-OK dispense"
      )) {
        console.log(testname)
        console.log(response)
        expect(convertMatchesExpectation).toBe(true)
      }
    }
  )
})
