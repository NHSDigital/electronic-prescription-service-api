import Hapi from "@hapi/hapi"
import {CONFIG} from "../../config"
import {URL, URLSearchParams} from "url"
import {createOAuthCodeFlowClient} from "../../oauthUtils"
import {createSession} from "../../services/session"
import {getPrBranchUrl, getRegisteredCallbackUrl, parseOAuthState, prRedirectEnabled, prRedirectRequired} from "../helpers"
import {getUtcEpochSeconds} from "../util"

export default {
  method: "GET",
  path: "/callback",
  options: {
    auth: false
  },
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {

    // Local
    if (CONFIG.environment.endsWith("sandbox")) {
      request.cookieAuth.set({})
      h.state("Access-Token-Fetched", getUtcEpochSeconds().toString(), {isHttpOnly: false})
      h.state("Access-Token-Set", "true", {isHttpOnly: false, ttl: CONFIG.refreshTokenTimeout})
      return h.redirect("/")
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

    const callbackUrl = new URL(`${getRegisteredCallbackUrl("callback")}?${getQueryString(request.query)}`)
    try {
      const oauthClient = createOAuthCodeFlowClient()
      const tokenResponse = await oauthClient.getToken(callbackUrl)

      createSession(tokenResponse, request, h)

      return h.redirect(CONFIG.baseUrl)
    } catch (e) {
      return h.response({error: e})
    }
  }
}

function getQueryString(query: Hapi.RequestQuery) {
  return Object.keys(query).map(key => `${key}=${query[key]}`).join("&")
}
