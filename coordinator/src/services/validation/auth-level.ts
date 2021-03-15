import * as Hapi from "@hapi/hapi"

export function requestHasAppAuth(request: Hapi.Request): boolean {
  return request.headers["nhsd-identity-authentication-method"].includes("application")
}

export function requestHasUserAuth(request: Hapi.Request): boolean {
  return request.headers["nhsd-identity-authentication-method"].includes("user")
}

export function requestHasUnusualAuth(request: Hapi.Request): boolean {
  return request.headers["nhsd-identity-authentication-method"].includes("unusual")
}
