import Hapi from "@hapi/hapi"
import createOAuthClient from "../../oauthUtils"
import {setSessionValue} from "../../services/session"
import {createOAuthState} from "../helpers"
import * as jsonwebtoken from "jsonwebtoken"
import * as uuid from "uuid"
import {URLSearchParams} from "url"
import axios from "axios"

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

    if (process.env.ENVIRONMENT?.endsWith("sandbox")) {
      // Local
      return h.response({redirectUri: "/callback"}).code(200)
    }

    if (loginInfo.authLevel === "system") {
      // Unattended (System)
      const apiKey = process.env.DEMO_APP_CLIENT_ID
      const privateKey = process.env.DEMO_APP_PRIVATE_KEY || ""
      const audience = `https://${process.env.ENVIRONMENT}.api.service.nhs.uk/oauth2/token`
      const keyId = process.env.DEMO_APP_KEY_ID

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
      const url = `https://${process.env.APIGEE_DOMAIN_NAME}/oauth2/token`
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

        const baseUrl = process.env.BASE_PATH
          ? `/${process.env.BASE_PATH}/`
          : "/"

        return h.response({redirectUri: baseUrl})
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
