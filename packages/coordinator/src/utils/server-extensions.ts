import Hapi from "@hapi/hapi"
import {fhir, processingErrors, validationErrors} from "@models"
import {ContentTypes} from "../routes/util"
import {Boom} from "@hapi/boom"
import {RequestHeaders} from "./headers"
import {isProd} from "./environment"

export const fatalResponse = {
  resourceType: "OperationOutcome",
  issue: [
    {
      severity: "fatal",
      code: "exception",
      details: {
        coding: [
          {
            system: "https://fhir.nhs.uk/CodeSystem/http-error-codes",
            code: "SERVER_ERROR",
            display: "500: The Server has encountered an error processing the request."
          }
        ]
      }
    }
  ]
}

export function reformatUserErrorsToFhir(
  request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
): Hapi.ResponseObject | symbol {
  const response = request.response
  const logger = request.logger
  if (response instanceof processingErrors.InconsistentValuesError) {
    // we do not log response here as we are sending back a different response
    logger.warn({payload: getPayload(request)}, "InconsistentValuesError")
    return responseToolkit.response(
      processingErrors.toOperationOutcomeError(response)
    ).code(400).type(ContentTypes.FHIR)
  } else if (response instanceof processingErrors.FhirMessageProcessingError) {
    // we do not log response here as we are sending back a different response
    logger.warn({payload: getPayload(request)}, "FhirMessageProcessingError")
    return responseToolkit.response(
      processingErrors.toOperationOutcomeFatal(response)
    ).code(400).type(ContentTypes.FHIR)
  } else if (response instanceof Boom) {
    // we log the original response here but we send back a different response
    logger.error({
      payload: getPayload(request),
      originalResponse: response
    }, "Boom")
    return responseToolkit.response(
      fatalResponse
    ).code(500).type(ContentTypes.FHIR)
  } else {
    if (!(request.response instanceof Boom)) {
      if (request.response.statusCode >= 400) {
        // we DO log response here as we are sending back the same response
        logger.warn({
          payload: getPayload(request),
          response
        }, "ErrorOrWarningResponse")
      }
    }
  }
  return responseToolkit.continue
}

function getPayload(request: Hapi.Request<Hapi.ReqRefDefaults>) {
  if (request.payload) {
    if (request.payload instanceof Buffer) {
      return request.payload.toString()
    }
    return request.payload
  }
  return {}
}

export function switchContentTypeForSmokeTest(
  request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
): Hapi.ResponseObject | symbol {
  const isSmokeTest = request.headers[RequestHeaders.SMOKE_TEST]
  if (!isSmokeTest) {
    return responseToolkit.continue
  }

  const response = request.response
  if (response instanceof Boom) {
    return responseToolkit.continue
  }

  const responseAsRequest = (response as Hapi.ResponseObject)
  const contentType = responseAsRequest.headers["content-type"]
  if (contentType === ContentTypes.FHIR) {
    responseAsRequest.type(ContentTypes.JSON)
  } else if (contentType === ContentTypes.XML) {
    responseAsRequest.type(ContentTypes.PLAIN_TEXT)
  }

  return responseToolkit.continue
}

export const invalidProdHeaders: Array<RequestHeaders> = [RequestHeaders.RAW_RESPONSE, RequestHeaders.SKIP_VALIDATION]

export const rejectInvalidProdHeaders: Hapi.Lifecycle.Method = (
  request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
) => {
  const logger = request.logger
  if (isProd()) {
    const listOfInvalidHeaders = Object.keys(request.headers).filter(
      requestHeader => invalidProdHeaders.includes(requestHeader as RequestHeaders)
    )
    if (listOfInvalidHeaders.length) {
      const errorMessage = `Request with id: ${
        request.headers[RequestHeaders.REQUEST_ID]
      } had invalid header(s): ${
        listOfInvalidHeaders
      }`
      logger.error({
        payload: getPayload(request),
        errorMessage
      }, "invalid headers")

      const issue = validationErrors.invalidHeaderOperationOutcome(listOfInvalidHeaders)
      return responseToolkit
        .response(fhir.createOperationOutcome([issue]))
        .code(403)
        .type(ContentTypes.FHIR)
        .takeover()
    }
  }
  return responseToolkit.continue
}
