import Hapi from "@hapi/hapi"
import {Token} from "../oauthUtils"
import {getUtcEpochSeconds} from "../routes/util"
import {CONFIG} from "../config"
import {isLocal} from "./environment"

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

export function createSession(tokenResponse: Token, request: Hapi.Request, h: Hapi.ResponseToolkit): void {
  request.cookieAuth.set({})
  const accessTokenFetchTime = getUtcEpochSeconds()
  const refreshTokenTimeout = 3599
  const timeTillRefresh = 599
  const nextRefreshTime = (accessTokenFetchTime + timeTillRefresh - 10)
  request.cookieAuth.ttl(refreshTokenTimeout)
  setSessionValue(`access_token`, tokenResponse.accessToken, request)
  setSessionValue(`oauth_data`, tokenResponse.data, request)
  setSessionValue(`last_token_refresh`, accessTokenFetchTime.toString(), request)
  setSessionValue(`next_refresh_time`, nextRefreshTime.toString(), request)
  h.state("Next-Refresh-Time", nextRefreshTime.toString(), {isHttpOnly: false})
  h.state("Access-Token-Fetched", accessTokenFetchTime.toString(), {isHttpOnly: false})
  h.state("Access-Token-Set", "true", {isHttpOnly: false})
  h.state("Token-Expires-In", refreshTokenTimeout.toString(), {isHttpOnly: false})
}

export function clearSession(request: Hapi.Request, h: Hapi.ResponseToolkit): void {
  request.cookieAuth.clear()
  request.yar.reset()
  request.state
  h.unstate("Next-Refresh-Time")
  h.unstate("Access-Token-Fetched")
  h.unstate("Access-Token-Set")
  h.unstate("Token-Expires-In")
}
