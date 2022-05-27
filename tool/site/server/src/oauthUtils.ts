import {CONFIG} from "./config"
import {getRegisteredCallbackUrl} from "./routes/helpers"
import Hapi from "@hapi/hapi"
import {URLSearchParams} from "url"
import axios from "axios"
import * as jsonwebtoken from "jsonwebtoken"
import * as uuid from "uuid"

//TODO: handle system oauth

export interface OAuthTokenResponse {
  access_token: string
  refresh_token: string
  scope: string
  token_type: string
  expires_in: number
}

interface CIS2TokenResponse extends OAuthTokenResponse {
  id_token: string
}

export async function getCIS2IdTokenFromAuthCode(request: Hapi.Request): Promise<string> {
  const authorisationCode = request.query.code

  const bodyParams = new URLSearchParams({
    "grant_type": "authorization_code",
    "client_id": CONFIG.cis2AppClientId,
    "client_secret": CONFIG.cis2AppClientSecret,
    "redirect_uri": "https://int.api.service.nhs.uk/eps-api-tool/callback",
    "code": authorisationCode
  })
  const axiosCIS2TokenResponse = await axios.post<CIS2TokenResponse>(
    `https://${CONFIG.cis2EgressHost}/openam/oauth2/realms/root/realms/NHSIdentity/realms/Healthcare/access_token`,
    bodyParams
  )

  return axiosCIS2TokenResponse.data.id_token
}

export async function exchangeCIS2IdTokenForApigeeAccessToken(idToken: string): Promise<OAuthTokenResponse> {
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
  const bodyParams = new URLSearchParams({
    "subject_token": idToken,
    "client_assertion": jwt,
    "subject_token_type": "urn:ietf:params:oauth:token-type:id_token",
    "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange"
  })

  // TODO: /token failure
  const axiosOAuthTokenResponse = await axios.post<OAuthTokenResponse>(`${CONFIG.apigeeEgressHost}/oauth2/token`, bodyParams)
  return axiosOAuthTokenResponse.data
}

export async function getApigeeAccessTokenFromAuthCode(request: Hapi.Request): Promise<OAuthTokenResponse> {
  // TODO: handle code not present
  const authorisationCode = request.query.code

  // TODO: match state on request

  const bodyParams = new URLSearchParams({
    "grant_type": "authorization_code",
    "client_id": CONFIG.apigeeAppClientId,
    "client_secret": CONFIG.apigeeAppClientSecret,
    "redirect_uri": getRegisteredCallbackUrl("callback"),
    "code": authorisationCode
  })

  // TODO: /token failure
  const axiosOAuthTokenResponse = await axios.post<OAuthTokenResponse>(`${CONFIG.apigeeEgressHost}/oauth2/token`, bodyParams)
  return axiosOAuthTokenResponse.data
}

export async function refreshApigeeAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
  const bodyParams = new URLSearchParams({
    "grant_type": "refresh_token",
    "client_id": CONFIG.apigeeAppClientId,
    "client_secret": CONFIG.apigeeAppClientSecret,
    "refresh_token": refreshToken
  })

  const axiosOAuthTokenResponse = await axios.post<OAuthTokenResponse>(`${CONFIG.apigeeEgressHost}/oauth2/token`, bodyParams)
  return axiosOAuthTokenResponse.data
}

export function refreshTokenExpired(oauthToken: OAuthTokenResponse): boolean {
  return Date.now() > oauthToken.expires_in
}
