import Hapi from "@hapi/hapi"
import {isProd} from "./environment"
import {fhir, validationErrors as errors} from "@models"
import {contentTypes} from "../routes/util"

export enum RequestHeaders {
  REQUEST_ID = "nhsd-request-id",
  AUTH_LEVEL = "nhsd-identity-authentication-level",
  RAW_RESPONSE = "x-raw-response",
  SKIP_VALIDATION = "x-skip-validation",
  SMOKE_TEST = "x-smoke-test"
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
      console.error(`Request with id: ${
        request.headers[RequestHeaders.REQUEST_ID]
      } had invalid header(s): ${
        listOfInvalidHeaders
      }`)
      const issue = errors.invalidHeaderOperationOutcome(listOfInvalidHeaders)
      return responseToolkit
        .response(fhir.createOperationOutcome([issue]))
        .code(403)
        .type(contentTypes.fhir)
        .takeover()
    }
  }
  return responseToolkit.continue
}
