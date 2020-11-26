import * as TestResources from "../../resources/test-resources"
import {translateToOperationOutcome} from "../../../src/services/translation/spine-response"
import {SpineDirectResponse} from "../../../src/models/spine"

describe("translateToOperationOutcome", () => {
  const spineResponses = TestResources.spineResponses

  it("converts spine successes", () => {
    const spineResponse = spineResponses.success.response
    const {operationOutcome, statusCode} = translateToOperationOutcome(spineResponse)

    expect(operationOutcome.issue).toHaveLength(1)
    expect(operationOutcome.issue[0].severity).toEqual("information")
    expect(operationOutcome.issue[0].code).toEqual("informational")
    expect(operationOutcome.issue[0].details).toBeFalsy()
    expect(statusCode).toBe(200)
  })

  test.each(TestResources.spineResponses.singleErrors)("converts spine single errors", (syncResponse) => {
    const {operationOutcome, statusCode} = translateToOperationOutcome(syncResponse.response)

    expect(operationOutcome.issue).toHaveLength(1)
    expect(operationOutcome.issue[0].details.coding).toHaveLength(1)
    expect(operationOutcome.issue[0].details.coding[0].code).toBe(syncResponse.spineErrorCode.toString())
    expect(operationOutcome.issue[0].details.coding[0].display).toBeTruthy()
    expect(statusCode).toBe(400)
  })

  test.each(TestResources.spineResponses.multipleErrors)("converts multiple spine errors", (syncResponse) => {
    const {operationOutcome, statusCode} = translateToOperationOutcome(syncResponse.response)

    expect(operationOutcome.issue.length).toBeGreaterThan(1)
    operationOutcome.issue.forEach(operationOutcomeIssue => {
      expect(operationOutcomeIssue.details.coding).toHaveLength(1)
      expect(operationOutcomeIssue.details.coding[0].code).toBe(syncResponse.spineErrorCode.toString())
      expect(operationOutcomeIssue.details.coding[0].display).toBeTruthy()
    })
    expect(statusCode).toBe(400)
  })

  test("returns specific response on unexpected spine response", () => {
    const bodyString = "this body doesnt pass the regex checks"
    const spineResponse: SpineDirectResponse<string> = {
      body: bodyString,
      statusCode: 420
    }

    const {operationOutcome, statusCode} = translateToOperationOutcome(spineResponse)

    expect(operationOutcome.issue).toHaveLength(1)
    expect(operationOutcome.issue[0].diagnostics).toBe(bodyString)
    expect(statusCode).toBe(400)
  })
})
