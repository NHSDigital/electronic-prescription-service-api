import pino from "pino"
import * as TestResources from "../../resources/test-resources"
import {
  convertBundleToSpineRequest,
  convertParametersToSpineRequest,
  convertTaskToSpineRequest
} from "../../../src/services/translation/request"
import {getMedicationRequests} from "../../../src/services/translation/common/getResourcesOfType"
import {fhir} from "@models"
import {isBundle, isParameters, isTask} from "../../../src/utils/type-guards"

const logger = pino()
process.env.ODS_URL = "directory.spineservices.nhs.uk"

describe("conversion tests", () => {
  test.each(TestResources.convertFailureExamples)(
    "should be able to convert %s message to HL7V3",
    async (_: string, request: unknown, response: string) => {
      const headers = {
        "nhsd-request-id": "test",
        "nhsd-asid": "200000001285"
      }

      // copy of convert route logic, todo: either test injecting request into endpoint
      // or refactor these checks into a testable method and remove duplication
      if (isBundle(request)) {
        let result = {
          message: ""
        }

        // this check is done in external validator
        // todo, ensure external validator is called during this test
        const medicationRequests = getMedicationRequests(request)
        if (medicationRequests.length > 4) {
          result.message = JSON.stringify(tooManyMedicationRequestsError(), null, 0)
          response = JSON.stringify(JSON.parse(response), null, 0)
        } else {
          result = await convertBundleToSpineRequest(request, headers, logger)
        }

        expect(result.message).toBe(response)

      } else if (isParameters(request)) {
        const result = convertParametersToSpineRequest(request, headers, logger)
        expect(result.message).toBe(response)

      } else if (isTask(request)) {
        const result = await convertTaskToSpineRequest(request, headers, logger)
        expect(result.message).toBe(response)
      }
    }
  )
})

// error returned from external validator
const tooManyMedicationRequestsError = (): fhir.OperationOutcome => ({
  resourceType: "OperationOutcome",
  meta: {
    lastUpdated: "2022-10-21T13:47:00+00:00"
  },
  issue: [{
    severity: "error",
    code: fhir.IssueCodes.PROCESSING,
    diagnostics: `Bundle contains too many resources of type MedicationRequest. Expected at most 4.`,
    expression: [
      "Bundle.entry"
    ]
  }]
})
