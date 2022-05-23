import Hapi from "@hapi/hapi"
import {clearSession, setSessionValue} from "../../services/session"
import {getRegisteredCallbackUrl} from "../helpers"
import * as jsonwebtoken from "jsonwebtoken"
import * as uuid from "uuid"
import {URLSearchParams} from "url"
import axios from "axios"
import {CONFIG} from "../../config"
import {getUtcEpochSeconds} from "../util"

interface LoginInfo {
  accessToken: string
  authLevel: "user-combined" | "user-separate" | "system"
}

interface UnattendedTokenResponse {
  access_token: string
  expires_in: string
  token_type: "Bearer"
}

function getRedirectUri(authorizeUrl: string, clientId: string, callbackUri: string, scopes?: Array<string>) {
  const queryParams: Record<string, string> = {
    "client_id": clientId,
    "redirect_uri": callbackUri,
    "response_type": "code",
    "state": uuid.v4()
  }
  if (scopes) {
    queryParams.scope = scopes.join("%20")
  }

  return `${authorizeUrl}?${new URLSearchParams(queryParams)}`
}

export default {
  method: "POST",
  path: "/login",
  options: {
    auth: false
  },
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    clearSession(request, h)

    const loginInfo = request.payload as LoginInfo

    if (CONFIG.environment.endsWith("sandbox")) {
      // Local
      return h.response({redirectUri: "/callback"}).code(200)
    }

    if (loginInfo.authLevel === "system") {
      // Unattended (System)
      const apiKey = CONFIG.combinedAuthClientId
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
      const url = `${CONFIG.privateApigeeUrl}/oauth2/token`
      const urlParams = new URLSearchParams([
        ["grant_type", "client_credentials"],
        ["client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"],
        ["client_assertion", jwt]
      ])

      const axiosResponse = await axios.post<UnattendedTokenResponse>(
        url,
        urlParams,
        {headers: {"content-type": "application/x-www-form-urlencoded"}}
      )
      const oauthResponse = axiosResponse.data
      const accessToken = oauthResponse.access_token

      if (accessToken) {
        setSessionValue(`access_token`, accessToken, request)

        request.cookieAuth.set({})

        h.state("Access-Token-Fetched", getUtcEpochSeconds().toString(), {isHttpOnly: false})
        h.state("Access-Token-Set", "true", {isHttpOnly: false, ttl: CONFIG.refreshTokenTimeout})

        return h.response({redirectUri: CONFIG.baseUrl})
      }

      return h.response({}).code(400)
    }

    const callbackUri = encodeURI(getRegisteredCallbackUrl("callback"))

    // Attended (user-separate)
    if (loginInfo.authLevel === "user-separate") {
      const authorizationUri = "https://am.nhsint.auth-ptl.cis2.spineservices.nhs.uk:443/openam/oauth2/realms/root/realms/NHSIdentity/realms/Healthcare/authorize"
      const scopes = ["openid", "profile"]
      const redirectUri = getRedirectUri(authorizationUri, CONFIG.separateAuthClientId, callbackUri, scopes)

      console.log(`Redirecting browser to: ${redirectUri}`)
      return h.response({redirectUri})
    }

    // Attended (User)
    const authorizationUri = `${CONFIG.privateApigeeUrl}/oauth2/authorize`
    const redirectUri = getRedirectUri(authorizationUri, CONFIG.combinedAuthClientId, callbackUri)

    console.log(`Redirecting browser to: ${redirectUri}`)
    return h.response({redirectUri})

  }
}
