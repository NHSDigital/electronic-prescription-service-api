import Hapi from "@hapi/hapi"
import {processingErrors as errors} from "@models"
import {CONTENT_TYPE_FHIR, CONTENT_TYPE_JSON, CONTENT_TYPE_PLAIN_TEXT, CONTENT_TYPE_XML} from "./routes/util"
import {Boom} from "@hapi/boom"
import {RequestHeaders} from "./services/headers"

export function reformatUserErrorsToFhir(
  request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
): Hapi.ResponseObject | symbol {
  const response = request.response
  if (response instanceof errors.FhirMessageProcessingError) {
    request.log("info", response)
    return responseToolkit.response(errors.toOperationOutcome(response)).code(400).type(CONTENT_TYPE_FHIR)
  } else if (response instanceof Boom) {
    request.log("error", response)
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

  const contentType = response.headers["content-type"]
  if (contentType === CONTENT_TYPE_FHIR) {
    response.type(CONTENT_TYPE_JSON)
  } else if (contentType === CONTENT_TYPE_XML) {
    response.type(CONTENT_TYPE_PLAIN_TEXT)
  }

  return responseToolkit.continue
}
