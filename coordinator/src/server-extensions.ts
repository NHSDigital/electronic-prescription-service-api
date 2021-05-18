import Hapi from "@hapi/hapi"
import {processingErrors as errors} from "@models"
import {ContentTypes} from "./routes/util"
import {Boom} from "@hapi/boom"
import {RequestHeaders} from "./services/headers"

export function reformatUserErrorsToFhir(
  request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
): Hapi.ResponseObject | symbol {
  const response = request.response
  if (response instanceof errors.FhirMessageProcessingError) {
    request.log("info", response)
    return responseToolkit.response(errors.toOperationOutcome(response)).code(400).type(ContentTypes.FHIR)
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
  if (contentType === ContentTypes.FHIR) {
    response.type(ContentTypes.JSON)
  } else if (contentType === ContentTypes.XML) {
    response.type(ContentTypes.PLAIN_TEXT)
  }

  return responseToolkit.continue
}
