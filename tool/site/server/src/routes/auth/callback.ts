import Hapi from "@hapi/hapi"
import {CONFIG} from "../../config"
import {URL, URLSearchParams} from "url"
import {createOAuthCodeFlowClient} from "../../oauthUtils"
import {createCIS2Session, createSession} from "../../services/session"
import {
  getPrBranchUrl,
  getRegisteredCallbackUrl,
  parseOAuthState,
  prRedirectEnabled,
  prRedirectRequired
} from "../helpers"
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

async function getCIS2IdToken(request: Hapi.Request) {
  const urlParams = new URLSearchParams([
    ["grant_type", "authorization_code"],
    ["code", request.query.code],
    ["redirect_uri", "https://int.api.service.nhs.uk/eps-api-tool/callback"],
    ["client_id", "128936811467.apps.national"],
    ["client_secret", CONFIG.cis2AppClientSecret]
  ])
  const axiosCIS2TokenResponse = await axios.post<CIS2TokenResponse>(
    `https://${CONFIG.cis2EgressHost}/openam/oauth2/realms/root/realms/NHSIdentity/realms/Healthcare/access_token`,
    urlParams
  )
  return axiosCIS2TokenResponse.data.id_token
}

async function exchangeCIS2IdTokenForApigeeAccessToken(idToken: string) {
  const apiKey = CONFIG.apigeeAppClientId
  const privateKey = CONFIG.apigeeAppJWTPrivateKey
  const audience = `${CONFIG.publicApigeeHost}/oauth2/token`
  const keyId = CONFIG.apigeeAppJWTKeyId

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
  const axiosOAuthTokenResponse = await axios.post<UnattendedTokenResponse>(`${CONFIG.apigeeEgressHost}/oauth2/token`, urlOAuthParams)
  return axiosOAuthTokenResponse.data.access_token
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
        const cis2IdToken = await getCIS2IdToken(request)

        const apigeeAccessToken = await exchangeCIS2IdTokenForApigeeAccessToken(cis2IdToken)

        createCIS2Session(apigeeAccessToken, request, h)

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
