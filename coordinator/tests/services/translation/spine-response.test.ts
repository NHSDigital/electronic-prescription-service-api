import * as TestResources from "../../resources/test-resources"
import {translateToOperationOutcome} from "../../../src/services/translation/spine-response"
import {SpineDirectResponse} from "../../../src/models/spine"

describe("translateToOperationOutcome", () => {
  const spineResponses = TestResources.spineResponses
  test("returns informational OperationOutcome for status code <= 299", () => {
    const spineResponse = spineResponses.success.response
    const result = translateToOperationOutcome(spineResponse)
    expect(result.operationOutcome.issue[0].severity).toEqual("information")
    expect(result.operationOutcome.issue[0].code).toEqual("informational")
  })

  test("returns error OperationOutcome for status code > 299", () => {
    const spineResponse = spineResponses.singleErrors[0].response
    const result = translateToOperationOutcome(spineResponse)
    expect(result.operationOutcome.issue[0].severity).toEqual("error")
    expect(result.operationOutcome.issue[0].code).toEqual("invalid")
  })

  it("converts spine successes", () => {
    const spineResponse = spineResponses.success.response
    const result = translateToOperationOutcome(spineResponse)

    expect(result.operationOutcome.issue[0].severity).toEqual("information")
    expect(result.operationOutcome.issue[0].code).toEqual("informational")
    expect(result.operationOutcome.issue[0].details).toBeFalsy()
  })

  test.each(TestResources.spineResponses.singleErrors)("converts spine single errors", (syncResponse) => {
    const actualOperationOutcome = translateToOperationOutcome(syncResponse.response)

    expect(actualOperationOutcome.operationOutcome.issue).toHaveLength(1)
    expect(actualOperationOutcome.operationOutcome.issue[0].details.coding).toHaveLength(1)
    expect(actualOperationOutcome.operationOutcome.issue[0].details.coding[0].code).toBe(
      syncResponse.spineErrorCode.toString()
    )
    expect(actualOperationOutcome.operationOutcome.issue[0].details.coding[0].display).toBeTruthy()
  })

  test.each(TestResources.spineResponses.multipleErrors)("converts multiple spine errors", (syncResponse) => {
    const actualOperationOutcome = translateToOperationOutcome(syncResponse.response)

    expect(actualOperationOutcome.operationOutcome.issue.length).toBeGreaterThan(1)
    actualOperationOutcome.operationOutcome.issue.forEach(operationOutcomeIssue => {
      expect(operationOutcomeIssue.details.coding).toHaveLength(1)
      expect(operationOutcomeIssue.details.coding[0].code).toBe(syncResponse.spineErrorCode.toString())
      expect(operationOutcomeIssue.details.coding[0].display).toBeTruthy()
    })
  })

  test("returns specific response on unexpected spine response", () => {
    const bodyString = "this body doesnt pass the regex checks"
    const spineResponse: SpineDirectResponse<string> = {
      body: bodyString,
      statusCode: 420
    }

    const actualOperationOutcome = translateToOperationOutcome(spineResponse)

    expect(actualOperationOutcome.operationOutcome.issue).toHaveLength(1)
    expect(actualOperationOutcome.operationOutcome.issue[0].diagnostics).toBe(bodyString)
  })
})
