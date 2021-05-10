import Hapi from "@hapi/hapi"
import {isProd} from "./environment"

export enum RequestHeaders {
  REQUEST_ID = "nhsd-request-id",
  AUTH_LEVEL = "nhsd-identity-authentication-level",
  RAW_RESPONSE = "x-raw-response",
  SKIP_VALIDATION = "x-skip-validation",
  SMOKE_TEST = "x-smoke-test"
}

const invalidProdHeaders: Array<RequestHeaders> = [RequestHeaders.RAW_RESPONSE, RequestHeaders.SKIP_VALIDATION]

export const rejectInvalidProdHeaders: Hapi.Lifecycle.Method = (
  request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
) => {
  if (isProd) {
    const presentInvalidHeaders = invalidProdHeaders.filter(invalidHeader => request.headers[invalidHeader])
    if (presentInvalidHeaders) {
      return responseToolkit.response().code(403)
    }
  }
  return request
}
