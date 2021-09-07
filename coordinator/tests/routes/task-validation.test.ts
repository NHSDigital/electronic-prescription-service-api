import Hapi from "@hapi/hapi"
import {validateQueryParameters} from "../../src/routes/tracker/task"
import {validationErrors} from "@models"

describe("task query parameter validation", () => {
  test("message with no valid query parameters get rejected", () => {
    const params: Hapi.RequestQuery = {
      "invalidParam": "true"
    }

    const errors = validateQueryParameters(params)

    expect(errors).toHaveLength(1)
    expect(errors[0].diagnostics).toContain("A valid query parameter must be supplied")
  })

  test("message with multiple of the same parameter get rejected", () => {
    const params: Hapi.RequestQuery = {
      "identifier": ["true", "false"]
    }

    const errors = validateQueryParameters(params)

    expect(errors.includes(validationErrors.invalidQueryParameterCombinationIssue))
  })

  test("message with multiple identifier parameters get rejected", () => {
    const params: Hapi.RequestQuery = {
      "identifier": "true",
      "focus:identifier": "true"
    }

    const errors = validateQueryParameters(params)

    expect(errors.includes(validationErrors.invalidQueryParameterCombinationIssue))
  })
})
