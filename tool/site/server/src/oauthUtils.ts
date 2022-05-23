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
    clientId: CONFIG.combinedAuthClientId,
    clientSecret: CONFIG.combinedAuthClientSecret,
    redirectUri: getRegisteredCallbackUrl("callback"),
    accessTokenUri: `${CONFIG.privateApigeeUrl}/oauth2/token`,
    authorizationUri: `${CONFIG.publicApigeeUrl}/oauth2/authorize`,
    body: {
      client_id: CONFIG.combinedAuthClientId,
      client_secret: CONFIG.combinedAuthClientSecret
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
