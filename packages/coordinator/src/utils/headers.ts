import Hapi from "@hapi/hapi"
import * as uuid from "uuid"
import {
  AWS_DISPENSING_USER_SCOPE,
  AWS_PRESCRIBING_USER_SCOPE,
  DISPENSING_USER_SCOPE,
  PRESCRIBING_USER_SCOPE,
  TRACKER_USER_SCOPE
} from "../services/validation/scope-validator"
import {enableDefaultAsidPartyKey, isEpsHostedContainer, isSandbox} from "./feature-flags"

export enum RequestHeaders {
  APPLICATION_ID = "nhsd-application-id",
  ASID = "nhsd-asid",
  AUTH_LEVEL = "nhsd-identity-authentication-level",
  PARTY_KEY = "nhsd-party-key",
  RAW_RESPONSE = "x-raw-response",
  REQUEST_ID = "nhsd-request-id",
  CORRELATION_ID = "nhsd-correlation-id",
  SCOPE = "nhsd-scope",
  SDS_ROLE_PROFILE_ID = "nhsd-session-urid",
  SDS_USER_UNIQUE_ID = "nhsd-identity-uuid",
  SKIP_VALIDATION = "x-skip-validation",
  SHOW_VALIDATION_WARNINGS = "x-show-validation-warnings",
  SMOKE_TEST = "x-smoke-test",
  PROXY_NAME = "apiproxy"
}

export const DEFAULT_SANDBOX_ASID = "200000001285"
export const DEFAULT_SANDBOX_PARTY_KEY = "DEFAULT_SANDBOX_PARTY_KEY"
export const DEFAULT_PTL_ASID = process.env.DEFAULT_PTL_ASID
export const DEFAULT_PTL_PARTY_KEY = process.env.DEFAULT_PTL_PARTY_KEY
export const DEFAULT_UUID = "555254239107"
export const DEFAULT_RPID = "555254240100" //S8000:G8000:R8001 - "Clinical":"Clinical Provision":"Nurse Access Role"
export const DEFAULT_SCOPE = `${PRESCRIBING_USER_SCOPE} ${DISPENSING_USER_SCOPE} ${TRACKER_USER_SCOPE}`
export const AWS_SCOPE = `${AWS_PRESCRIBING_USER_SCOPE} ${AWS_DISPENSING_USER_SCOPE}`
export const DEFAULT_SHOW_VALIDATION_WARNINGS = "false"
const DEFAULT_APPLICATION_ID = "00000000-0000-0000-0000-000000000000"

function getHeaderIdentifier(headers: Hapi.Utils.Dictionary<string>, identifier: RequestHeaders): string {
  return isSandbox() ? uuid.v4() : headers[identifier].toUpperCase()
}

export function getRequestId(headers: Hapi.Utils.Dictionary<string>): string {
  return getHeaderIdentifier(headers, RequestHeaders.REQUEST_ID)
}

export function getCorrelationId(headers: Hapi.Utils.Dictionary<string>): string {
  return getHeaderIdentifier(headers, RequestHeaders.CORRELATION_ID)
}

export function getAsid(headers: Hapi.Utils.Dictionary<string>): string {
  if (isSandbox()) {
    return DEFAULT_SANDBOX_ASID
  }
  if (headers[RequestHeaders.ASID] !== undefined) {
    return headers[RequestHeaders.ASID]
  }
  if (isEpsHostedContainer() && enableDefaultAsidPartyKey()) {
    return DEFAULT_PTL_ASID
  }

  throw new Error("Could not get ASID")
}

export function getPartyKey(headers: Hapi.Utils.Dictionary<string>): string {
  if (isSandbox()) {
    return DEFAULT_SANDBOX_PARTY_KEY
  }
  if (headers[RequestHeaders.PARTY_KEY] !== undefined) {
    return headers[RequestHeaders.PARTY_KEY]
  }
  if (isEpsHostedContainer() && enableDefaultAsidPartyKey()) {
    return DEFAULT_PTL_PARTY_KEY
  }

  throw new Error("Could not get party key")
}

export function getSdsUserUniqueId(headers: Hapi.Utils.Dictionary<string>): string {
  return isSandbox() ? DEFAULT_UUID : headers[RequestHeaders.SDS_USER_UNIQUE_ID]
}

export function getSdsRoleProfileId(headers: Hapi.Utils.Dictionary<string>): string {
  return isSandbox() ? DEFAULT_RPID : headers[RequestHeaders.SDS_ROLE_PROFILE_ID]
}

export function getScope(headers: Hapi.Utils.Dictionary<string>): string {
  // scope is not passed through with proxygen but it is verified by it
  // so we can just return what scopes are checked in proxygen
  if (isEpsHostedContainer()) {
    return AWS_SCOPE
  }
  return isSandbox() ? DEFAULT_SCOPE : headers[RequestHeaders.SCOPE]
}

export function getShowValidationWarnings(headers: Hapi.Utils.Dictionary<string>): string {
  return isSandbox()
    ? DEFAULT_SHOW_VALIDATION_WARNINGS
    : headers[RequestHeaders.SHOW_VALIDATION_WARNINGS]
}

export function getApplicationId(headers: Hapi.Utils.Dictionary<string>): string {
  return process.env.SANDBOX === "1" ? DEFAULT_APPLICATION_ID : headers[RequestHeaders.APPLICATION_ID]
}

export enum ProxyName {
  EPS_FHIR_DISPENSING = "EPS-FHIR-DISPENSING",
  EPS_FHIR_PRESCRIBING = "EPS-FHIR-PRESCRIBING",
  EPS_FHIR = "EPS-FHIR",
}

export function getProxyName(headers: Hapi.Utils.Dictionary<string>): string {
  if (isEpsHostedContainer()) {
    const proxyName = headers[RequestHeaders.PROXY_NAME]
    if (proxyName) {
      if (proxyName.includes("fhir-dispensing")) {
        return ProxyName.EPS_FHIR_DISPENSING
      }
      if (proxyName.includes("fhir-prescribing")) {
        return ProxyName.EPS_FHIR_PRESCRIBING
      }
      // we do not know what it is so just return dispensing
      return ProxyName.EPS_FHIR_DISPENSING
    }
  }
  return ProxyName.EPS_FHIR
}
