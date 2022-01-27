import Hapi from "@hapi/hapi"
import * as jsonwebtoken from "jsonwebtoken"
import * as uuid from "uuid"
import {URLSearchParams} from "url"
import axios from "axios"

export default {
  method: "GET",
  path: "/get-unattended-access-token",
  handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
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

    try {
      const axiosResponse = await axios.post<TokenResponse>(
        url,
        urlParams,
        {headers: {"content-type": "application/x-www-form-urlencoded"}}
      )
      const oauthResponse = axiosResponse.data

      return responseToolkit.response(oauthResponse).code(200)
    } catch (e) {
      if (axios.isAxiosError(e)) {
        request.logger.error("AXIOS ERROR", e.message)
        return responseToolkit.response(e.message).code(e.code ? parseInt(e.code) : 500)
      }
      request.logger.error("NOT AXIOS ERROR", e)
      return responseToolkit.response({e}).code(500)
    }
  }
}

interface TokenResponse {
  access_token: string
  expires_in: string
  token_type: "Bearer"
}
