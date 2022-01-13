import Hapi from "@hapi/hapi"
import * as jsonwebtoken from "jsonwebtoken"
import * as uuid from "uuid"
import {setSessionValue} from "../../services/session"
import {URLSearchParams} from "url"
import axios from "axios"

export default [
  {
    method: "POST",
    path: "/login",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const loginInfo = request.payload as any
      const auth_method = loginInfo.auth_method
      const access_token = loginInfo.access_token
      setSessionValue(`auth_method`, auth_method, request)
      setSessionValue(`access_token`, access_token, request)
      return h.response({}).code(200)
    }
  },
  {
    method: "GET",
    path: "/unattended-login",
    handler: async (_: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
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
      console.log("JWT: ", jwt)
      const urlParams = new URLSearchParams([
        ["grant_type", "client_credentials"],
        ["client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"],
        ["client_assertion", jwt]
      ])

      try {
        const axiosResponse = await axios.post<TokenResponse>(
          audience,
          urlParams,
          {headers: {"content-type": "application/x-www-form-urlencoded"}}
        )
        const accessToken = axiosResponse.data.access_token

        return responseToolkit.response({accessToken}).code(200)
      } catch (e) {
        if (axios.isAxiosError(e)) {
          console.log(e.message)
          return responseToolkit.response(e.message).code(parseInt(e.code || "500"))
        }
        return responseToolkit.response({e}).code(500)
      }
    }
  }
]

interface TokenResponse {
  access_token: string
  expires_in: string
  token_type: "Bearer"
}

