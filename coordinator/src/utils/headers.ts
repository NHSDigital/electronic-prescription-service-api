import Hapi from "@hapi/hapi"

export enum RequestHeaders {
  REQUEST_ID = "nhsd-request-id",
  AUTH_LEVEL = "nhsd-identity-authentication-level",
  ASID = "nhsd-asid",
  PARTY_KEY = "nhsd-party-key",
  SDS_USER_UNIQUE_ID = "nhsd-identity-uuid",
  SDS_ROLE_PROFILE_ID = "nhsd-session-urid",
  RAW_RESPONSE = "x-raw-response",
  SKIP_VALIDATION = "x-skip-validation",
  SMOKE_TEST = "x-smoke-test"
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

export function getSdsUserUniqueId(headers: Hapi.Util.Dictionary<string>): string {
  return headers[RequestHeaders.SDS_USER_UNIQUE_ID]
}

export function getSdsRoleProfileId(headers: Hapi.Util.Dictionary<string>): string {
  return headers[RequestHeaders.SDS_ROLE_PROFILE_ID]
}
