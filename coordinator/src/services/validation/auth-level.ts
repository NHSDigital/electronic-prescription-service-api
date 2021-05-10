import * as Hapi from "@hapi/hapi"
import {RequestHeaders} from "../headers"

export function userHasValidAuth(request: Hapi.Request, authLevel: "user" | "application"): boolean {
  if (requiresAuth()) {
    if (authLevel === "user") {
      return requestHasUserAuth(request)
    } else {
      return requestHasAppAuth(request)
    }
  }
  return true
}

function requiresAuth() {
  return process.env.SANDBOX !== "1"
}

function requestHasAppAuth(request: Hapi.Request): boolean {
  return request.headers[RequestHeaders.AUTH_LEVEL]?.includes("application")
}

function requestHasUserAuth(request: Hapi.Request): boolean {
  return request.headers[RequestHeaders.AUTH_LEVEL]?.includes("user")
}
