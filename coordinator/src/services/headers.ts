import Hapi from "@hapi/hapi"

export enum RequestHeaders {
  REQUEST_ID = "nhsd-request-id",
  AUTH_LEVEL = "nhsd-identity-authentication-level",
  ASID = "nhsd-asid",
  RAW_RESPONSE = "x-raw-response",
  SKIP_VALIDATION = "x-skip-validation",
  SMOKE_TEST = "x-smoke-test",
  PARTY_KEY = "nhsd-party-key"
}

export function getRequestId(headers: Hapi.Util.Dictionary<string>): string {
  return headers[RequestHeaders.REQUEST_ID].toUpperCase()
}

export function getAsid(headers: Hapi.Util.Dictionary<string>): string {
  return headers[RequestHeaders.ASID]
}

export function getPartyKey(headers: Hapi.Util.Dictionary<string>): string {
  return headers[RequestHeaders.PARTY_KEY]
}
