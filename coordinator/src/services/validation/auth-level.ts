import * as Hapi from "@hapi/hapi"

export function userHasValidAuth(headers: Hapi.Util.Dictionary<string>, authLevel: "user" | "application"): boolean {
  if (requiresAuth()) {
    if (authLevel === "user") {
      return requestHasUserAuth(headers)
    } else {
      return requestHasAppAuth(headers)
    }
  }
  return true
}

function requiresAuth() {
  return process.env.SANDBOX !== "1"
}

function requestHasAppAuth(headers: Hapi.Util.Dictionary<string>): boolean {
  return headers["nhsd-identity-authentication-level"]?.includes("application")
}

function requestHasUserAuth(headers: Hapi.Util.Dictionary<string>): boolean {
  return headers["nhsd-identity-authentication-level"]?.includes("user")
}
