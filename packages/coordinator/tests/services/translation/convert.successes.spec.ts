import * as TestResources from "../../resources/test-resources"
import {fhir} from "@models"
import {convert} from "../../convert"

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
