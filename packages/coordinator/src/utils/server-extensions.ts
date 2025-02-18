import Hapi from "@hapi/hapi"
import {fhir, processingErrors, validationErrors} from "@models"
import {ContentTypes} from "../routes/util"
import {Boom} from "@hapi/boom"
import {RequestHeaders} from "./headers"
import {isProd} from "./environment"

export function reformatUserErrorsToFhir(
  request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
): Hapi.ResponseObject | symbol {
  const response = request.response
  const logger = request.logger
  if (response instanceof processingErrors.InconsistentValuesError) {
    logger.info({response}, "InconsistentValuesError")
    return responseToolkit.response(
      processingErrors.toOperationOutcomeError(response)
    ).code(400).type(ContentTypes.FHIR)
  } else if (response instanceof processingErrors.FhirMessageProcessingError) {
    logger.info({response}, "FhirMessageProcessingError")
    return responseToolkit.response(
      processingErrors.toOperationOutcomeFatal(response)
    ).code(400).type(ContentTypes.FHIR)
  } else if (response instanceof Boom) {
    logger.error({response}, "Boom")
  } else {
    if (response.statusCode >= 400) {
      logger.warn({"error": {
        res: {
          statusCode: response.statusCode,
          body: response.source,
          Headers: response.headers
        }
      }
      }, "error or warning response")
    }
  }
  return responseToolkit.continue
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
      request.logger.error(errorMessage)
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
