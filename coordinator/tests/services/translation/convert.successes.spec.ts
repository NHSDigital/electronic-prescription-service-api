import pino from "pino"
import * as TestResources from "../../resources/test-resources"
import {
  convertBundleToSpineRequest,
  convertClaimToSpineRequest,
  convertParametersToSpineRequest,
  convertTaskToSpineRequest
} from "../../../src/services/translation/request"
import {
  isBundle,
  isClaim,
  isParameters,
  isTask
} from "../../../src/utils/type-guards"
import {fetcher, fhir} from "@models"

const logger = pino()

describe("conversion tests", () => {
  beforeAll(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date(2022, 1, 1));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test.each(TestResources.convertSuccessExamples)(
    "should be able to convert %s message to HL7V3",
    async (testname: string, request: fhir.Resource, response: string, responseMatcher: string) => {
      const regex = new RegExp(responseMatcher)
      const isMatch = regex.test(response)
      expect(isMatch).toBe(true)
      const result = await convert(request)
      const convertMatchesExpectation = regex.test(result.message)
      expect(convertMatchesExpectation).toBe(true)
    }
  )

  const successExamplesThatAreNotJestCases = fetcher.convertExamples.filter(e => e.isSuccess)
  test.skip.each(successExamplesThatAreNotJestCases)(
    "regenerate convert snapshots",
    async (convertCase) => {
      const request = convertCase.request
      const convertResponse = await convert(request)
      convertCase.rewriteResponseFile(convertResponse.message)
    }
  )
})

async function convert(request: fhir.Resource) {
  // copy of convert route logic, todo: either test injecting request into endpoint
  // or refactor these checks into a testable method and remove duplication
  if (isBundle(request)) {
    return await convertBundleToSpineRequest(request, TestResources.validTestHeaders, logger)
  } else if (isParameters(request)) {
    return await convertParametersToSpineRequest(request, TestResources.validTestHeaders, logger)
  } else if (isTask(request)) {
    return await convertTaskToSpineRequest(request, TestResources.validTestHeaders, logger)
  } else if (isClaim(request)) {
    return await convertClaimToSpineRequest(request, TestResources.validTestHeaders, logger)
  }
}
