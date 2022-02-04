import Hapi from "@hapi/hapi"
import createOAuthClient from "../../oauthUtils"
import {setSessionValue} from "../../services/session"
import {createOAuthState} from "../helpers"
import * as jsonwebtoken from "jsonwebtoken"
import * as uuid from "uuid"
import {URLSearchParams} from "url"
import axios from "axios"
import {CONFIG} from "../../config"

interface LoginInfo {
  accessToken: string
  authLevel: "user" | "system"
  authMethod: string
}

interface UnattendedTokenResponse {
  access_token: string
  expires_in: string
  token_type: "Bearer"
}

export default {
  method: "POST",
  path: "/login",
  options: {
    auth: false
  },
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {

    const loginInfo = request.payload as LoginInfo

    setSessionValue(`auth_level`, loginInfo.authLevel, request)
    setSessionValue(`auth_method`, loginInfo.authMethod, request)

    if (CONFIG.environment.endsWith("sandbox")) {
      // Local
      return h.response({redirectUri: "/callback"}).code(200)
    }

    if (loginInfo.authLevel === "system") {
      // Unattended (System)
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
        h.state("Last-Token-Fetched", Math.round(new Date().getTime() / 1000).toString(), {isHttpOnly: false})
        h.state("Access-Token-Set", "true", {isHttpOnly: false})

        return h.response({redirectUri: CONFIG.baseUrl})
      }

      return h.response({}).code(400)
    }

    // Attended (User)

    const oauthClient = createOAuthClient()

    const redirectUri = oauthClient.getUri({
      state: createOAuthState()
    })

    return h.response({redirectUri})
  }
}
