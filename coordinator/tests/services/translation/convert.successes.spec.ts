import pino from "pino"
import * as TestResources from "../../resources/test-resources"
import {
  convertBundleToSpineRequest,
  convertParametersToSpineRequest,
  convertTaskToSpineRequest
} from "../../../src/services/translation/request"
import {isBundle, isParameters, isTask} from "../../../src/routes/util"

const logger = pino()

describe("conversion tests", () => {
  beforeAll(() =>
    process.env.SANDBOX = "1"
  )
  afterAll(() => {
    delete process.env.SANDBOX
  })

  test.each(TestResources.convertSuccessExamples)(
    "should be able to convert %s message to HL7V3",
    async (_: string, request: unknown, response: string, responseMatcher: string) => {
      const regex = new RegExp(responseMatcher)
      const isMatch = regex.test(response)
      expect(isMatch).toBe(true)

      // copy of convert route logic, todo: either test injecting request into endpoint
      // or refactor these checks into a testable method and remove duplication
      if (isBundle(request)) {
        const result = await convertBundleToSpineRequest(request, "", logger)
        const convertMatchesExpectation = regex.test(result.message)
        expect(convertMatchesExpectation).toBe(true)
      } else if (isParameters(request)) {
        const result = await convertParametersToSpineRequest(request, "", logger)
        const convertMatchesExpectation = regex.test(result.message)
        expect(convertMatchesExpectation).toBe(true)
      } else if (isTask(request)) {
        const result = await convertTaskToSpineRequest(request, "", logger)
        const convertMatchesExpectation = regex.test(result.message)
        expect(convertMatchesExpectation).toBe(true)
      }
    }
  )
})
