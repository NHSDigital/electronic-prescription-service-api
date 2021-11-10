import Hapi from "@hapi/hapi"
import {validationErrors} from "@models"
import {validateQueryParameters} from "../../../src/services/validation/query-validator"
import {TRACKER_USER_SCOPE} from "../../../src/services/validation/scope-validator"

describe("task query parameter validation", () => {
  test("message with no valid query parameters is rejected", () => {
    const params: Hapi.RequestQuery = {
      "invalidParam": "true"
    }

    const errors = validateQueryParameters(params, TRACKER_USER_SCOPE)

    expect(errors).toHaveLength(1)
    expect(errors[0].diagnostics).toContain("A valid query parameter must be supplied")
  })

  test("message with multiple of the same parameter is rejected", () => {
    const params: Hapi.RequestQuery = {
      "identifier": ["true", "false"]
    }

    const errors = validateQueryParameters(params, TRACKER_USER_SCOPE)

    expect(errors.includes(validationErrors.invalidQueryParameterCombinationIssue))
  })

  test("message with multiple identifier parameters is rejected", () => {
    const params: Hapi.RequestQuery = {
      "identifier": "true",
      "focus:identifier": "true"
    }

    const errors = validateQueryParameters(params, TRACKER_USER_SCOPE)

    expect(errors.includes(validationErrors.invalidQueryParameterCombinationIssue))
  })

  test("identifier with incorrect system is rejected", () => {
    const params: Hapi.RequestQuery = {
      "patient:identifier": "https://example.com|9876543210"
    }

    const errors = validateQueryParameters(params, TRACKER_USER_SCOPE)

    expect(errors.includes(validationErrors.invalidQueryParameterCombinationIssue))
  })

  test("valid query parameter with system is accepted", () => {
    const params: Hapi.RequestQuery = {
      "patient:identifier": "https://fhir.nhs.uk/Id/nhs-number|9876543210"
    }

    const errors = validateQueryParameters(params, TRACKER_USER_SCOPE)

    expect(errors).toHaveLength(0)
  })

  test("valid query parameter without system is accepted", () => {
    const params: Hapi.RequestQuery = {
      "patient:identifier": "9876543210"
    }

    const errors = validateQueryParameters(params, TRACKER_USER_SCOPE)

    expect(errors).toHaveLength(0)
  })
})
