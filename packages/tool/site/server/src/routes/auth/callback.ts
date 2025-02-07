import Hapi, {Request, RouteDefMethods} from "@hapi/hapi"
import {CONFIG} from "../../config"
import {URLSearchParams} from "url"
import {createCombinedAuthSession, createSandboxAuthSession, createSeparateAuthSession} from "../../services/session"
import {
  getPrBranchUrl,
  parseOAuthState,
  prRedirectEnabled,
  prRedirectRequired
} from "../helpers"
import {
  exchangeCIS2IdTokenForApigeeAccessToken,
  getApigeeAccessTokenFromAuthCode,
  getCIS2IdTokenFromAuthCode
} from "../../oauthUtils"

export default {
  method: "GET" as RouteDefMethods,
  path: "/callback",
  options: {
    auth: false
  },
  handler: async (request: Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    // Local
    if (CONFIG.environment.endsWith("sandbox")) {
      createSandboxAuthSession(request, h)
      return h.redirect(CONFIG.baseUrl)
    }

    // Deployed Versions
    const state = parseOAuthState(request.query.state as string, request.logger)

    if (prRedirectRequired(state.prNumber)) {
      if (prRedirectEnabled()) {
        const queryString = new URLSearchParams(request.query).toString()
        return h.redirect(getPrBranchUrl(state.prNumber, "callback", queryString))
      } else {
        return h.response({}).code(400)
      }
    }

    if (isSeparateAuthLogin(request)) {
      try {
        const cis2IdToken = await getCIS2IdTokenFromAuthCode(request)

        const apigeeAccessToken = await exchangeCIS2IdTokenForApigeeAccessToken(cis2IdToken)

        createSeparateAuthSession(apigeeAccessToken, request, h)

        return h.redirect(CONFIG.baseUrl)
      } catch (e) {
        request.logger.error(`Callback failed: ${e}`)
        return h.response({error: e})
      }
    }

    try {
      const tokenResponse = await getApigeeAccessTokenFromAuthCode(request, CONFIG.environment !== "int")

      createCombinedAuthSession(tokenResponse, request, h)

      return h.redirect(CONFIG.baseUrl)
    } catch (e) {
      return h.response({error: e})
    }
  }
}

function isSeparateAuthLogin(request: Hapi.Request) {
  const queryString = new URLSearchParams(request.query)
  return queryString.has("client_id")
}
