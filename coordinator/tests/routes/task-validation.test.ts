import Hapi from "@hapi/hapi"
import {invalidQueryParameterCombinationIssue, noValidQueryParameters, validateQueryParameters} from "../../src/routes/tracker/task"

describe("task query parameter validation", () => {
  test("message with no valid query parameters get rejected", () => {
    const params: Hapi.RequestQuery = {
      "invalidParam": "true"
    }

    const errors = validateQueryParameters(params)

    expect(errors.includes(noValidQueryParameters))
  })

  test("message with multiple of the same parameter get rejected", () => {
    const params: Hapi.RequestQuery = {
      "identifier": ["true", "false"]
    }

    const errors = validateQueryParameters(params)

    expect(errors.includes(invalidQueryParameterCombinationIssue))
  })

  test("message with multiple identifier parameters get rejected", () => {
    const params: Hapi.RequestQuery = {
      "identifier": "true",
      "focus:identifier": "true"
    }

    const errors = validateQueryParameters(params)

    expect(errors.includes(invalidQueryParameterCombinationIssue))
  })
})
