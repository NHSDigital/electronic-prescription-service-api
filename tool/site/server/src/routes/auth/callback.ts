import Hapi from "@hapi/hapi"
import {CONFIG} from "../../config"
import {URL, URLSearchParams} from "url"
import {createOAuthCodeFlowClient} from "../../oauthUtils"
import {createSession, getSessionValue} from "../../services/session"
import {getPrBranchUrl, getRegisteredCallbackUrl, parseOAuthState, prRedirectEnabled, prRedirectRequired} from "../helpers"
import {getUtcEpochSeconds} from "../util"
import * as jsonwebtoken from "jsonwebtoken"
import * as uuid from "uuid"

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

    const authLevel = getSessionValue("auth_level", request)
    if (authLevel === "user-cis2")
    {
      const apiKey = CONFIG.clientId
      const privateKey = CONFIG.privateKey
      const audience = `${CONFIG.publicApigeeUrl}/oauth2/token`
      const keyId = CONFIG.keyId

      const jwt = jsonwebtoken.sign(
        {},
        Buffer.from(privateKey, "base64").toString("utf-8"),
        {
          algorithm: "RS512",
          issuer: apiKey,
          subject: apiKey,
          audience: audience,
          keyid: keyId,
          expiresIn: 300,
          jwtid: uuid.v4()
        }
      )
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
