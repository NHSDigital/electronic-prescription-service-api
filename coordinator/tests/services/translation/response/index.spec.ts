import * as TestResources from "../../../resources/test-resources"
import {translateToFhir} from "../../../../src/services/translation/response"
import {fhir, spine} from "@models"
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

  test.each(TestResources.spineResponses.singleErrors)("converts spine prescribing single errors", (spineResponse) => {
    checkBodyIssueAndStatusCodeSingleErrors(spineResponse, spineResponse.epsPrescribeErrorCode)
  })

  test.each(TestResources.spineResponses.singleErrors)("converts spine unhandled message type single errors",
    (spineResponse) => {
      checkBodyIssueAndStatusCodeSingleErrors(spineResponse,  spineResponse.spineErrorCode)
    })

  test.each(TestResources.spineResponses.multipleErrors)("converts multiple Prescribe spine errors",
    (spineResponse) => {
      checkBodyIssueAndStatusCodeMultipleErrors(spineResponse, spineResponse.epsPrescribeErrorCode)
    })

  test.each(TestResources.spineResponses.multipleErrors)("converts multiple unhandled message type spine errors",
    (spineResponse) => {
      checkBodyIssueAndStatusCodeMultipleErrors(spineResponse,  spineResponse.spineErrorCode)
    })

  function checkBodyIssueAndStatusCodeSingleErrors(
    responseObject: TestResources.ExampleSpineResponse,
    errorCode: string){
    checkBodyIssueAndStatusCode(responseObject, errorCode, false)
  }

  function checkBodyIssueAndStatusCodeMultipleErrors(
    responseObject: TestResources.ExampleSpineResponse,
    errorCode: string){
    checkBodyIssueAndStatusCode(responseObject, errorCode, true)
  }

  function checkBodyIssueAndStatusCode(
    responseObject: TestResources.ExampleSpineResponse,
    errorCode: string,
    multipleErrors: boolean
  ) {
    const returnedValues = translateToFhir(responseObject.response, logger)
    const body = returnedValues.fhirResponse as fhir.OperationOutcome
    const statusCode = returnedValues.statusCode

    expect(statusCode).toBe(400)
    multipleErrors ? expect(body.issue.length).toBeGreaterThan(1) : expect(body.issue).toHaveLength(1)
    body.issue.forEach(operationOutcomeIssue => {
      expect(operationOutcomeIssue.details.coding).toHaveLength(1)
      expect(operationOutcomeIssue.details.coding[0].code).toBe(errorCode)
      expect(operationOutcomeIssue.details.coding[0].display).toBeTruthy()
    })
  }

  test("returns internal server error on unexpected spine response", () => {
    const bodyString = "this body doesnt pass the regex checks"
    const spineResponse: spine.SpineDirectResponse<string> = {
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
