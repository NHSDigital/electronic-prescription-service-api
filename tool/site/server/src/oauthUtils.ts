import ClientOAuth2 from "client-oauth2"
import {CONFIG} from "./config"
import {getRegisteredCallbackUrl} from "./routes/helpers"

export interface Token {
  data: ClientOAuth2.Data
  tokenType: string
  accessToken: string
  refreshToken: string
}

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

export async function refreshToken(data: ClientOAuth2.Data): Promise<ClientOAuth2.Token> {
  const oauthClientToken = createOAuthClient().createToken(data)
  const refreshedToken = await oauthClientToken.refresh()
  return refreshedToken
}

export function createOAuthCodeFlowClient(): ClientOAuth2.CodeFlow {
  return createOAuthClient().code
}
