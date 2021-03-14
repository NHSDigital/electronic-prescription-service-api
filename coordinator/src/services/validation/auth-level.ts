import * as Hapi from "@hapi/hapi"

export function requestHasAppAuth(request: Hapi.Request): boolean {
  return request.headers["NHSD-Identity-Authentication-Method"].includes("application")
}

export function requestHasUserAuth(request: Hapi.Request): boolean {
  return request.headers["NHSD-Identity-Authentication-Method"].includes("user")
}

export function requestHasUnusualAuth(request: Hapi.Request): boolean {
  return request.headers["NHSD-Identity-Authentication-Method"].includes("unusual")
}
