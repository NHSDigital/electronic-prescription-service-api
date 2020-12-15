import * as TestResources from "../../resources/test-resources"
import {translateToFhir} from "../../../src/services/translation/spine-response"
import {SpineDirectResponse} from "../../../src/models/spine"
import * as fhir from "../../../src/models/fhir/fhir-resources"

describe("translateToOperationOutcome", () => {
  const spineResponses = TestResources.spineResponses

  it("converts spine successes", () => {
    const spineResponse = spineResponses.success.response
    const returnedValues = translateToFhir(spineResponse)
    const body = returnedValues.fhirResponse as fhir.OperationOutcome
    const statusCode = returnedValues.statusCode
    expect(body.issue).toHaveLength(1)
    expect(body.issue[0].severity).toEqual("information")
    expect(body.issue[0].code).toEqual("informational")
    expect(body.issue[0].details).toBeFalsy()
    expect(statusCode).toBe(200)
  })

  test.each(TestResources.spineResponses.singleErrors)("converts spine single errors", (syncResponse) => {
    const returnedValues = translateToFhir(syncResponse.response)
    const body = returnedValues.fhirResponse as fhir.OperationOutcome
    const statusCode = returnedValues.statusCode

    expect(body.issue).toHaveLength(1)
    expect(body.issue[0].details.coding).toHaveLength(1)
    expect(body.issue[0].details.coding[0].code).toBe(syncResponse.spineErrorCode.toString())
    expect(body.issue[0].details.coding[0].display).toBeTruthy()
    expect(statusCode).toBe(400)
  })

  test.each(TestResources.spineResponses.multipleErrors)("converts multiple spine errors", (syncResponse) => {
    const returnedValues = translateToFhir(syncResponse.response)
    const body = returnedValues.fhirResponse as fhir.OperationOutcome
    const statusCode = returnedValues.statusCode

    expect(body.issue.length).toBeGreaterThan(1)
    body.issue.forEach(operationOutcomeIssue => {
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

    const returnedValues = translateToFhir(spineResponse)
    const body = returnedValues.fhirResponse as fhir.OperationOutcome
    const statusCode = returnedValues.statusCode

    expect(body.issue).toHaveLength(1)
    expect(body.issue[0].diagnostics).toBe(bodyString)
    expect(statusCode).toBe(400)
  })
})
