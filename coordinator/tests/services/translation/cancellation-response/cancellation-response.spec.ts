import * as TestResources from "../../../resources/test-resources"
import {SPINE_CANCELLATION_ERROR_RESPONSE_REGEX} from "../../../../src/services/translation/common"
import {
  translateSpineCancelResponseIntoBundle
} from "../../../../src/services/translation/cancellation/cancellation-response"
import {getMedicationRequests, getPatient} from "../../../../src/services/translation/common/getResourcesOfType"

describe("translateSpineCancelResponseIntoBundle", () => {
  const actualError = TestResources.spineResponses.cancellationError
  const cancelResponse = SPINE_CANCELLATION_ERROR_RESPONSE_REGEX.exec(actualError.response.body)[0]
  const result = translateSpineCancelResponseIntoBundle(cancelResponse)

  test("response is a bundle", () => {
    expect(result.resourceType).toBe("Bundle")
  })

  test("response bundle contains entries", () => {
    expect(result.entry.length).toBeGreaterThan(0)
  })

  test("response bundle entries contains a MedicationRequest", () => {
    expect(getMedicationRequests(result).length).toBeGreaterThan(0)
  })

  test("response bundle entries contains a Patient", () => {
    expect(() => getPatient(result)).not.toThrow()
  })
})
