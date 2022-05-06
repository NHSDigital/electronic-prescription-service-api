import Hapi from "@hapi/hapi"
import {CONFIG} from "../../config"
import {URL, URLSearchParams} from "url"
import {createOAuthCodeFlowClient} from "../../oauthUtils"
import {createSession, createCIS2Session} from "../../services/session"
import {getPrBranchUrl, getRegisteredCallbackUrl, parseOAuthState, prRedirectEnabled, prRedirectRequired} from "../helpers"
import {getUtcEpochSeconds} from "../util"
import * as jsonwebtoken from "jsonwebtoken"
import * as uuid from "uuid"
import axios from "axios"

interface CIS2TokenResponse {
  access_token: string
  refresh_token: string
  scope: string
  id_token: string
  token_type: string
  expires_in: number
}

interface UnattendedTokenResponse {
  access_token: string
  expires_in: string
  token_type: "Bearer"
}

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

    if (isSeparateAuthLogin(request)) {
      try {
      //CIS2 Token Endpoint using the Auth code from the Authentication URL, returns IDToken for later token exchange.
        const urlParams = new URLSearchParams([
          ["grant_type", "authorization_code"],
          ["code", request.query.code],
          ["redirect_uri", "https://int.api.service.nhs.uk/eps-api-tool/callback"],
          ["client_id", "128936811467.apps.national"],
          ["client_secret", CONFIG.cis2Secret]
        ])
        const axiosCIS2TokenResponse = await axios.post<CIS2TokenResponse>(
          `https://${CONFIG.cis2EgressHost}/openam/oauth2/realms/root/realms/NHSIdentity/realms/Healthcare/access_token`,
          urlParams
        )
        const idToken = axiosCIS2TokenResponse.data.id_token

        //JWT Set-up, used for token exchange.
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

        //Token Exchange for OAuth2 Access Token
        const urlOAuthParams = new URLSearchParams([
          ["subject_token", idToken],
          ["client_assertion", jwt],
          ["subject_token_type", "urn:ietf:params:oauth:token-type:id_token"],
          ["client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"],
          ["grant_type", "urn:ietf:params:oauth:grant-type:token-exchange"]
        ])
        const axiosOAuthTokenResponse = await axios.post<UnattendedTokenResponse>(`${CONFIG.privateApigeeUrl}/oauth2/token`, urlOAuthParams)
        const accessToken = axiosOAuthTokenResponse.data.access_token

        createCIS2Session(accessToken, request, h)

        return h.redirect(CONFIG.baseUrl)
      } catch (e) {
        console.log(`Callback failed: ${e}`)
        return h.response({error: e})
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

function isSeparateAuthLogin(request: Hapi.Request) {
  const queryString = new URLSearchParams(request.query)
  return queryString.has("client_id")
}
