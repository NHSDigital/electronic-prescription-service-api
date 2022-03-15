import Hapi from "@hapi/hapi"
import * as uuid from "uuid"
import {DISPENSING_USER_SCOPE, PRESCRIBING_USER_SCOPE, TRACKER_USER_SCOPE} from "../services/validation/scope-validator"

export enum RequestHeaders {
  ASID = "nhsd-asid",
  AUTH_LEVEL = "nhsd-identity-authentication-level",
  ODS_CODE = "nhsd-ods-code",
  PARTY_KEY = "nhsd-party-key",
  RAW_RESPONSE = "x-raw-response",
  REQUEST_ID = "nhsd-request-id",
  ROLE_CODE = "nhsd-role-code",
  SCOPE = "nhsd-scope",
  SDS_ROLE_PROFILE_ID = "nhsd-session-urid",
  SDS_USER_UNIQUE_ID = "nhsd-identity-uuid",
  SKIP_VALIDATION = "x-skip-validation",
  SHOW_VALIDATION_WARNINGS = "x-show-validation-warnings",
  SMOKE_TEST = "x-smoke-test",
  USER_NAME = "nhsd-user-name"
}

export const DEFAULT_ASID = "200000001285"
export const DEFAULT_UUID = "555254239107"
export const DEFAULT_RPID = "555254240100" //S8000:G8000:R8001 - "Clinical":"Clinical Provision":"Nurse Access Role"
export const DEFAULT_SCOPE = `${PRESCRIBING_USER_SCOPE} ${DISPENSING_USER_SCOPE} ${TRACKER_USER_SCOPE}`
export const DEFAULT_ODS = "FER21"
export const DEFAULT_ROLE_CODE = "S8000:G8000:R8003"
export const DEFAULT_USER_NAME = "USERQ RANDOM Mr"
export const SHOW_VALIDATION_WARNINGS = "true"

export function getRequestId(headers: Hapi.Util.Dictionary<string>): string {
  return process.env.SANDBOX === "1" ? uuid.v4() : headers[RequestHeaders.REQUEST_ID].toUpperCase()
}

export function getAsid(headers: Hapi.Util.Dictionary<string>): string {
  return process.env.SANDBOX === "1" ? DEFAULT_ASID : headers[RequestHeaders.ASID]
}

export function getPartyKey(headers: Hapi.Util.Dictionary<string>): string {
  return headers[RequestHeaders.PARTY_KEY]
}

export function getSdsUserUniqueId(headers: Hapi.Util.Dictionary<string>): string {
  return process.env.SANDBOX === "1" ? DEFAULT_UUID : headers[RequestHeaders.SDS_USER_UNIQUE_ID]
}

export function getSdsRoleProfileId(headers: Hapi.Util.Dictionary<string>): string {
  return process.env.SANDBOX === "1" ? DEFAULT_RPID : headers[RequestHeaders.SDS_ROLE_PROFILE_ID]
}

export function getScope(headers: Hapi.Util.Dictionary<string>): string {
  return process.env.SANDBOX === "1" ? DEFAULT_SCOPE : headers[RequestHeaders.SCOPE]
}

export function getOdsCode(headers: Hapi.Util.Dictionary<string>): string {
  return process.env.SANDBOX === "1" ? DEFAULT_ODS : headers[RequestHeaders.ODS_CODE]
}

export function getRoleCode(headers: Hapi.Util.Dictionary<string>): string {
  return process.env.SANDBOX === "1" ? DEFAULT_ROLE_CODE : headers[RequestHeaders.ROLE_CODE]
}

export function getUserName(headers: Hapi.Util.Dictionary<string>): string {
  return process.env.SANDBOX === "1" ? DEFAULT_USER_NAME : headers[RequestHeaders.USER_NAME]
}

export function getShowValdiationWarnings(headers: Hapi.Util.Dictionary<string>): string {
  return process.env.SANDBOX === "1" ? SHOW_VALIDATION_WARNINGS : headers[RequestHeaders.SHOW_VALIDATION_WARNINGS]
}
