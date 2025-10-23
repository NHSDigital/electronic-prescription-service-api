import ClientOAuth2 from "client-oauth2"
import {CONFIG} from "./config"
import {getRegisteredCallbackUrl} from "./routes/helpers"
import Hapi from "@hapi/hapi"
import {URLSearchParams} from "url"
import axios from "axios"
import * as jsonwebtoken from "jsonwebtoken"

//TODO: handle system oauth

function createOAuthClient(): ClientOAuth2 {
  return new ClientOAuth2({
    clientId: CONFIG.apigeeAppClientId,
    clientSecret: CONFIG.apigeeAppClientSecret,
    redirectUri: getRegisteredCallbackUrl("callback"),
    accessTokenUri: `${CONFIG.apigeeEgressHost}/oauth2/token`,
    authorizationUri: `${CONFIG.publicApigeeHost}/oauth2/authorize`,
    body: {
      client_id: CONFIG.apigeeAppClientId,
      client_secret: CONFIG.apigeeAppClientSecret
    }
  })
}

// TODO: refresh token
export async function refreshToken(data: ClientOAuth2.Data): Promise<ClientOAuth2.Token> {
  const oauthClientToken = createOAuthClient().createToken(data)
  const refreshedToken = await oauthClientToken.refresh()
  return refreshedToken
}

export interface OAuthTokenResponse {
  access_token: string
  refresh_token: string
  scope: string
  token_type: string
  expires_in: number
}

export interface UserInfoResponse {
  sub: string,
  nationalrbacaccess: {
    nhsid_nrbac_roles: Array<{
      person_roleid: string
    }>
  }
}

interface CIS2TokenResponse extends OAuthTokenResponse {
  id_token: string
}

export async function getCIS2TokenFromAuthCode(request: Hapi.Request): Promise<CIS2TokenResponse> {
  const authorisationCode = request.query.code

  const bodyParams = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CONFIG.cis2AppClientId,
    client_secret: CONFIG.cis2AppClientSecret,
    redirect_uri: "https://int.api.service.nhs.uk/eps-api-tool/callback",
    code: authorisationCode
  })
  const axiosCIS2TokenResponse = await axios.post<CIS2TokenResponse>(
    `https://${CONFIG.cis2EgressHost}/openam/oauth2/realms/root/realms/NHSIdentity/realms/Healthcare/access_token`,
    bodyParams
  )

  return axiosCIS2TokenResponse.data
}

export async function exchangeCIS2IdTokenForApigeeAccessToken(idToken: string): Promise<OAuthTokenResponse> {
  const apiKey = CONFIG.apigeeAppClientId
  const privateKey = CONFIG.apigeeAppJWTPrivateKey
  const audience = `${CONFIG.publicApigeeHost}/oauth2/token`
  const keyId = CONFIG.apigeeAppJWTKeyId

  const jwt = jsonwebtoken.sign({}, Buffer.from(privateKey, "base64").toString("utf-8"), {
    algorithm: "RS512",
    issuer: apiKey,
    subject: apiKey,
    audience: audience,
    keyid: keyId,
    expiresIn: 300,
    jwtid: crypto.randomUUID()
  })

  //Token Exchange for OAuth2 Access Token
  const bodyParams = new URLSearchParams({
    subject_token: idToken,
    client_assertion: jwt,
    subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
    client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange"
  })

  // TODO: /token failure
  // eslint-disable-next-line max-len
  const axiosOAuthTokenResponse = await axios.post<OAuthTokenResponse>(`${CONFIG.apigeeEgressHost}/oauth2/token`, bodyParams)
  return axiosOAuthTokenResponse.data
}

// eslint-disable-next-line max-len
export async function getApigeeAccessTokenFromAuthCode(request: Hapi.Request, mock: boolean): Promise<OAuthTokenResponse> {
  // TODO: handle code not present
  const authorisationCode = request.query.code

  // TODO: match state on request

  const bodyParams = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CONFIG.apigeeAppClientId,
    client_secret: CONFIG.apigeeAppClientSecret,
    redirect_uri: getRegisteredCallbackUrl("callback"),
    code: authorisationCode
  })
  const path = mock ? "oauth2-mock/token" : "oauth2/token"
  // TODO: /token failure
  const axiosOAuthTokenResponse = await axios.post<OAuthTokenResponse>(`${CONFIG.apigeeEgressHost}/${path}`, bodyParams)
  return axiosOAuthTokenResponse.data
}

export function getSelectedRoleFromTokenResponse(tokenResponse: OAuthTokenResponse): string | undefined {
  const decodedToken = jsonwebtoken.decode(tokenResponse.access_token) as jsonwebtoken.JwtPayload

  return decodedToken?.["selected_roleid"] as string | undefined
}

export async function getUserInfoRbacRoleFromCIS2Token(
  request: Hapi.Request,
  cis2Token: CIS2TokenResponse
): Promise<string> {
  const logger = request.logger

  const access_token = cis2Token.access_token
  const id_token = cis2Token.id_token

  logger.info("Fetching userinfo to verify sub claim and get RBAC role")
  const axiosUserInfoResponse = await axios.get<UserInfoResponse>(
    `https://${CONFIG.cis2EgressHost}/openam/oauth2/realms/root/realms/NHSIdentity/realms/Healthcare/userinfo`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    }
  )
  logger.info(`Userinfo response: ${JSON.stringify(axiosUserInfoResponse.data)}`)

  // Verify sub claim
  const decodedIdToken = jsonwebtoken.decode(id_token) as jsonwebtoken.JwtPayload
  if (decodedIdToken.sub !== axiosUserInfoResponse.data.sub) {
    throw new Error(
      `sub claim in id_token does not match sub in userinfo response:`
        +`${decodedIdToken.sub} !== ${axiosUserInfoResponse.data.sub}`
    )
  }

  const roles = axiosUserInfoResponse.data.nationalrbacaccess.nhsid_nrbac_roles
  logger.info(`Userinfo roles: ${JSON.stringify(roles)}`)

  if (roles.length === 0) {
    throw new Error("No roles found for user")
  }

  logger.info(`Selecting first role from userinfo roles: ${JSON.stringify(roles[0])}`)
  return roles[0].person_roleid
}
