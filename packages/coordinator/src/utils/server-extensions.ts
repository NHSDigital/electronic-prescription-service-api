import Hapi from "@hapi/hapi"
import {fhir, processingErrors, validationErrors} from "@models"
import {ContentTypes} from "../routes/util"
import {Boom} from "@hapi/boom"
import {RequestHeaders} from "./headers"
import {isProd} from "./environment"
import {isEpsHostedContainer} from "./feature-flags"

export function reformatUserErrorsToFhir(
  request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
): Hapi.ResponseObject | symbol {
  const response = request.response
  const logPayload = isEpsHostedContainer()
  if (response instanceof processingErrors.InconsistentValuesError) {
    // we do not log response here as we are sending back a different response
    request.log("info", {
      msg: "InconsistentValuesError",
      payload: getPayload(request, logPayload)
    })
    return responseToolkit.response(
      processingErrors.toOperationOutcomeError(response)
    ).code(400).type(ContentTypes.FHIR)
  } else if (response instanceof processingErrors.FhirMessageProcessingError) {
    // we do not log response here as we are sending back a different response
    request.log("info", {
      msg: "FhirMessageProcessingError",
      payload: getPayload(request, logPayload)
    })
    return responseToolkit.response(
      processingErrors.toOperationOutcomeFatal(response)
    ).code(400).type(ContentTypes.FHIR)
  } else if (response instanceof Boom) {
    // we DO log response here as we are sending back the same response
    request.log("error", {
      msg: "Boom",
      payload: getPayload(request, logPayload),
      response
    })
  } else {
    if (response.statusCode >= 400) {
    // we DO log response here as we are sending back the same response
      request.log("info", {
        msg: "ErrorOrWarningResponse",
        payload: getPayload(request, logPayload),
        response
      })
    }
  }
  return responseToolkit.continue
}

function getPayload(request: Hapi.Request<Hapi.ReqRefDefaults>, logPayload: boolean) {
  if (!logPayload) {
    return {}
  }
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
  const logPayload = isEpsHostedContainer()
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
      request.log("error", {
        msg: "invalid headers",
        payload: getPayload(request, logPayload),
        errorMessage
      })

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
