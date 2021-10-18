import Hapi from "@hapi/hapi"
import {isLocal} from "./environment"

export function getSessionValue(key: string, request: Hapi.Request): any {
  const sessionValue = request.yar.get(key)
  if (isLocal()) {
    console.log(`Retrieved ${key} from session with value: ${JSON.stringify(sessionValue)}`)
  }
  if (Object.keys(sessionValue).length === 1 && Object.keys(sessionValue)[0] === "arrayValues") {
    return sessionValue.arrayValues
  }
  return sessionValue
}

export function getSessionValueOrDefault(key: string, request: Hapi.Request, fallback: unknown): any {
  return request.yar.get(key) ?? fallback
}

export function setSessionValue(key: string, value: unknown, request: Hapi.Request): void {
  if (Array.isArray(value)) {
    value = {arrayValues: value}
  }
  if (isLocal()) {
    console.log(`Saving ${key} to session with value: ${JSON.stringify(value)}`)
  }
  request.yar.set(key, value)
}
