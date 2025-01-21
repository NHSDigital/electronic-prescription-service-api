import * as TestResources from "../../../resources/test-resources"
import {translateToFhir} from "../../../../src/services/translation/response"
import {fhir, spine} from "@models"
import pino from "pino"
import {SpineResponseHandler} from "../../../../src/services/translation/response/spine-response-handler"

describe("translateToFhir", () => {
  const {spineResponses, validTestHeaders} = TestResources
  const logger = pino()

  it("converts spine prescription-order successes", async () => {
    const spineResponse = spineResponses.success.response
    const returnedValues = await translateToFhir(spineResponse, logger, validTestHeaders)
    const body = returnedValues.fhirResponse as fhir.OperationOutcome
    const statusCode = returnedValues.statusCode
    expect(body.issue).toHaveLength(1)
    expect(body.issue[0].severity).toEqual("information")
    expect(body.issue[0].code).toEqual("informational")
    expect(body.issue[0].details).toBeFalsy()
    expect(statusCode).toBe(200)
  })

  const testCases = [
    ...TestResources.spineResponses.singleErrors,
    ...TestResources.spineResponses.multipleErrors
  ]

  test.each(testCases)("returns a valid response for errors (single or multiple) from spine",
    async (spineResponse) => {
      const returnedValues = await translateToFhir(spineResponse.response, logger, validTestHeaders)
      const body = returnedValues.fhirResponse as fhir.OperationOutcome
      const statusCode = returnedValues.statusCode

      expect(body).not.toEqual(SpineResponseHandler.createServerErrorResponse().fhirResponse)
      expect(statusCode).toBe(400)
    })

  test("returns internal server error on unexpected spine response", async () => {
    const loggerSpy = jest.spyOn(logger, "error")
    const bodyString = "this body does not pass the regex checks"
    const spineResponse: spine.SpineDirectResponse<string> = {
      body: bodyString,
      statusCode: 420
    }

    const returnedValues = await translateToFhir(spineResponse, logger, validTestHeaders)
    const body = returnedValues.fhirResponse as fhir.OperationOutcome

    expect(body).toEqual(SpineResponseHandler.createServerErrorResponse().fhirResponse)
    expect(returnedValues.statusCode).toBe(500)
    expect(loggerSpy).toHaveBeenCalledWith(
      {"hl7Message":{"body":"this body does not pass the regex checks", "statusCode":420}}, "Unhandled Spine response"
    )
  })

  test.each([spineResponses.cancellationSuccess, spineResponses.cancellationDispensedError])(
    "cancellation returns Bundle when no issueCode", async (spineResponse) => {
      const translatedResponse = await translateToFhir(spineResponse.response, logger, validTestHeaders)

      expect(translatedResponse.fhirResponse.resourceType).toBe("Bundle")
      expect(translatedResponse.statusCode).toBe(spineResponse.response.statusCode)
    })

  test.each([spineResponses.cancellationNotFoundError])(
    "cancellation returns operationOutcome when issueCode present", async (spineResponse) => {
      const translatedResponse = await translateToFhir(spineResponse.response, logger, validTestHeaders)

      expect(translatedResponse.fhirResponse.resourceType).toBe("OperationOutcome")
      expect(translatedResponse.statusCode).toBe(spineResponse.response.statusCode)
    })
})
