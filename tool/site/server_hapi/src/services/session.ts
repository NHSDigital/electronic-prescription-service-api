import Hapi from "@hapi/hapi"
import {isLocal} from "./environment"

export function getSessionValue(key: string, request: Hapi.Request): any {
  const sessionValue = request.yar.get(key)
  if (isLocal()) {
    if (sessionValue === null) {
      console.error(`Failed to retrieve session value for key: ${key}`)
    } else {
      console.error(`Retrieved ${key} from session with value: ${JSON.stringify(sessionValue)}`)
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
  if (isLocal()) {
    console.error(`Saving ${key} to session with value: ${JSON.stringify(value)}`)
  }
  request.yar.set(key, value)
}

export function appendToSessionValue(key: string, value: unknown, request: Hapi.Request) {
  const existingValue = getSessionValue(key, request)
  if (Array.isArray(existingValue)) {
    const mergedValue = existingValue.concat(value)
    setSessionValue(key, mergedValue, request)
  }
}
