import Hapi from "@hapi/hapi"
import {createOAuthCodeFlowClient} from "../../oauthUtils"
import {clearSession, setSessionValue} from "../../services/session"
import {createOAuthState} from "../helpers"
import * as jsonwebtoken from "jsonwebtoken"
import * as uuid from "uuid"
import {URLSearchParams} from "url"
import axios from "axios"
import {CONFIG} from "../../config"
import {getUtcEpochSeconds} from "../util"

interface LoginInfo {
  accessToken: string
  authLevel: "user" | "user-cis2" | "system"
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
    clearSession(request, h)

    const loginInfo = request.payload as LoginInfo

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

        h.state("Access-Token-Fetched", getUtcEpochSeconds().toString(), {isHttpOnly: false})
        h.state("Access-Token-Set", "true", {isHttpOnly: false, ttl: CONFIG.refreshTokenTimeout})

        return h.response({redirectUri: CONFIG.baseUrl})
      }

      return h.response({}).code(400)
    }

    if (loginInfo.authLevel === "user-cis2") {
      // Attended (User-CIS2)
      const callbackUri = encodeURI("https://int.api.service.nhs.uk/eps-api-tool/callback")
      const clientid = "128936811467.apps.national"
      // eslint-disable-next-line max-len
      const axiosAuthResponse = await axios.get(`https://am.nhsint.auth-ptl.cis2.spineservices.nhs.uk:443/openam/oauth2/realms/root/realms/NHSIdentity/realms/Healthcare/authorize?client_id=${clientid}&redirect_uri=${callbackUri}&response_type=code&scope=openid%20profile&state=af0ifjsldkj`)

      const redirectUri = axiosAuthResponse.request.res.responseUrl
      // const url = `https://am.nhsint.auth-ptl.cis2.spineservices.nhs.uk:443/openam/oauth2/realms/root/realms/NHSIdentity/realms/Healthcare/access_token`
      // const axiosTokenResponse = await axios.post(url)
      // console.log(axiosTokenResponse.data)

      // const oauthClient = createCIS2OAuthCodeFlowClient()
      // const redirectUri = oauthClient.getUri({state: createOAuthState()})

      return h.response({redirectUri})
    }

    // Attended (User)
    const oauthClient = createOAuthCodeFlowClient()
    const redirectUri = oauthClient.getUri({state: createOAuthState()})

    return h.response({redirectUri})

  }
}
