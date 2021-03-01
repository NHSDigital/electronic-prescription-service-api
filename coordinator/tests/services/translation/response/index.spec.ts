import * as TestResources from "../../../resources/test-resources"
import {translateToFhir} from "../../../../src/services/translation/response"
import {SpineDirectResponse} from "../../../../src/models/spine"
import * as fhir from "../../../../src/models/fhir"
import pino from "pino"

describe("translateToFhir", () => {
  const spineResponses = TestResources.spineResponses
  const logger = pino()

  it("converts spine prescription-order successes", () => {
    const spineResponse = spineResponses.success.response
    const returnedValues = translateToFhir(spineResponse, logger)
    const body = returnedValues.fhirResponse as fhir.OperationOutcome
    const statusCode = returnedValues.statusCode
    expect(body.issue).toHaveLength(1)
    expect(body.issue[0].severity).toEqual("information")
    expect(body.issue[0].code).toEqual("informational")
    expect(body.issue[0].details).toBeFalsy()
    expect(statusCode).toBe(200)
  })

  test.each(TestResources.spineResponses.singleErrors)("converts spine single errors", (syncResponse) => {
    const returnedValues = translateToFhir(syncResponse.response, logger)
    const body = returnedValues.fhirResponse as fhir.OperationOutcome
    const statusCode = returnedValues.statusCode

    expect(body.issue).toHaveLength(1)
    expect(body.issue[0].details.coding).toHaveLength(1)
    expect(body.issue[0].details.coding[0].code).toBe(syncResponse.spineErrorCode.toString())
    expect(body.issue[0].details.coding[0].display).toBeTruthy()
    expect(statusCode).toBe(400)
  })

  test.each(TestResources.spineResponses.multipleErrors)("converts multiple spine errors", (syncResponse) => {
    const returnedValues = translateToFhir(syncResponse.response, logger)
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

  test("returns internal server error on unexpected spine response", () => {
    const bodyString = "this body doesnt pass the regex checks"
    const spineResponse: SpineDirectResponse<string> = {
      body: bodyString,
      statusCode: 420
    }

    const returnedValues = translateToFhir(spineResponse, logger)
    const body = returnedValues.fhirResponse as fhir.OperationOutcome
    const statusCode = returnedValues.statusCode

    expect(body.issue).toHaveLength(1)
    expect(body.issue[0].diagnostics).toBeUndefined()
    expect(statusCode).toBe(500)
  })

  const cancellationResponses = [spineResponses.cancellationSuccess, spineResponses.cancellationError]
  test.each(cancellationResponses)("cancellation returns Bundle", (spineResponse) => {
    const translatedResponse = translateToFhir(spineResponse.response, logger)

    expect(translatedResponse.fhirResponse.resourceType).toBe("Bundle")
    expect(translatedResponse.statusCode).toBe(spineResponse.response.statusCode)
  })
})
