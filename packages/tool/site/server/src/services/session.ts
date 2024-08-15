import Hapi from "@hapi/hapi"
import {getUtcEpochSeconds} from "../routes/util"
import {CONFIG} from "../config"
import {isLocal} from "./environment"
import {OAuthTokenResponse} from "../oauthUtils"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSessionValue(key: string, request: Hapi.Request): any {
  const sessionValue = request.yar.get(key)
  if (isLocal(CONFIG.environment)) {
    if (sessionValue === null) {
      console.error(`Failed to retrieve session value for key: ${key}`)
    } else {
      console.log(`Retrieved ${key} from session with value: ${JSON.stringify(sessionValue)}`)
    }
  }
  if (sessionValue && Object.keys(sessionValue).length === 1 && Object.keys(sessionValue)[0] === "arrayValues") {
    return sessionValue.arrayValues
  }
  return sessionValue
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSessionValueOrDefault(key: string, request: Hapi.Request, fallback: unknown): any {
  return getSessionValue(key, request) ?? fallback
}

export function setSessionValue(key: string, value: unknown, request: Hapi.Request): void {
  if (Array.isArray(value)) {
    value = {arrayValues: value}
  }
  if (isLocal(CONFIG.environment)) {
    console.log(`Saving ${key} to session with value: ${JSON.stringify(value)}`)
  }
  request.yar.set(key, value)
}

export function appendToSessionValue(key: string, value: unknown, request: Hapi.Request): void {
  const existingValue = getSessionValueOrDefault(key, request, [])
  if (!Array.isArray(existingValue)) {
    throw Error(`Cannot append to session value with key: '${key}', session value is not an array`)
  }
  const mergedValue = existingValue.concat(value)
  setSessionValue(key, mergedValue, request)
}

export function appendToSessionValueWithoutDuplication(key: string, value: unknown, request: Hapi.Request): void {
  const existingValue = getSessionValueOrDefault(key, request, [])
  if (!Array.isArray(existingValue)) {
    throw Error(`Cannot append to session value with key: '${key}', session value is not an array`)
  }
  if (!existingValue.includes(value)) {
    const mergedValue = existingValue.concat(value)
    setSessionValue(key, mergedValue, request)
  }
}

export function removeFromSessionValue(key: string, value: unknown, request: Hapi.Request): void {
  const existingValue = getSessionValueOrDefault(key, request, [])
  if (!Array.isArray(existingValue)) {
    throw Error(`Cannot remove an entry from session value with key: '${key}', session value is not an array`)
  }
  const valueWithEntryRemoved = existingValue.filter(v => v !== value)
  setSessionValue(key, valueWithEntryRemoved, request)
}

export function clearSessionValue(key: string, request: Hapi.Request): void {
  request.yar.clear(key)
}

function createAuthSession(tokenResponse: OAuthTokenResponse, request: Hapi.Request, h: Hapi.ResponseToolkit) {
  request.cookieAuth.set({})
  const accessTokenFetchTime = getUtcEpochSeconds()
  const refreshTokenTimeout = CONFIG.refreshTokenTimeout
  const timeTillRefresh = 599
  const nextRefreshTime = accessTokenFetchTime + timeTillRefresh - 10
  request.cookieAuth.ttl(refreshTokenTimeout)
  // TODO: type session values
  setSessionValue("access_token_data", tokenResponse, request)
  setSessionValue("next_refresh_time", nextRefreshTime, request)
  h.state("Next-Refresh-Time", nextRefreshTime.toString(), {isHttpOnly: false})
  h.state("Access-Token-Fetched", accessTokenFetchTime.toString(), {isHttpOnly: false})
  h.state("Access-Token-Set", "true", {isHttpOnly: false, ttl: refreshTokenTimeout})
  h.state("Token-Expires-In", (refreshTokenTimeout / 1000).toString(), {isHttpOnly: false})
}

export function createSandboxAuthSession(request: Hapi.Request, h: Hapi.ResponseToolkit): void {
  const sandboxTokenResponse: OAuthTokenResponse = {
    access_token: "sandboxAccessToken",
    refresh_token: "sandboxRefreshToken",
    scope: "",
    token_type: "Bearer",
    expires_in: 1000 * 60 * 60
  }
  createAuthSession(sandboxTokenResponse, request, h)
}

export function createCombinedAuthSession(
  tokenResponse: OAuthTokenResponse, request: Hapi.Request, h: Hapi.ResponseToolkit
): void {
  createAuthSession(tokenResponse, request, h)
  h.state("Auth-Method", "Combined")
  h.state("Auth-Level", "User")
}

export function createSeparateAuthSession(
  tokenResponse: OAuthTokenResponse, request: Hapi.Request, h: Hapi.ResponseToolkit
): void {
  createAuthSession(tokenResponse, request, h)
  h.state("Auth-Method", "Separate")
  h.state("Auth-Level", "User")
}

export function getApigeeAccessTokenFromSession(request: Hapi.Request): string {
  if (isLocal(CONFIG.environment)) {
    return "sandbox-token"
  }
  const accessTokenData = getSessionValue("access_token_data", request)
  return accessTokenData.access_token
}

export function clearSession(request: Hapi.Request, h: Hapi.ResponseToolkit): void {
  request.yar.reset()
  request.cookieAuth.clear()
  h.unstate("Next-Refresh-Time")
  h.unstate("Access-Token-Fetched")
  h.unstate("Access-Token-Set")
  h.unstate("Token-Expires-In")
  h.unstate("Auth-Method")
  h.unstate("Auth-Level")
}
