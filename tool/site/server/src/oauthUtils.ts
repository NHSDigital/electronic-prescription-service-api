import ClientOAuth2 from "client-oauth2"
import {URL} from "url"
import {CONFIG} from "./config"
import {getRegisteredCallbackUrl} from "./routes/helpers"

export interface OAuthClient {
  getUri: (options?: ClientOAuth2.Options) => string
  getToken: (uri: URL) => Promise<Token>
}

export interface Token {
  data: ClientOAuth2.Data
  tokenType: string
  accessToken: string
  refreshToken: string
}

function createOAuthClient(): ClientOAuth2 {
  return new ClientOAuth2({
    clientId: CONFIG.clientId,
    clientSecret: CONFIG.clientSecret,
    redirectUri: getRegisteredCallbackUrl("callback"),
    accessTokenUri: `${CONFIG.privateApigeeUrl}/oauth2/token`,
    authorizationUri: `${CONFIG.publicApigeeUrl}/oauth2/authorize`,
    body: {
      client_id: CONFIG.clientId,
      client_secret: CONFIG.clientSecret
    }
  })
}

function createCIS2OAuthClient(): ClientOAuth2 {
  return new ClientOAuth2({
    clientId: "128936811467.apps.national",
    clientSecret: "1f88b870-9980-482a-95f4-395aaa01d699",
    redirectUri: getRegisteredCallbackUrl("callback"),
    accessTokenUri: `${CONFIG.privateApigeeUrl}/oauth2/token`,
    authorizationUri: `https://am.nhsdev.auth-ptl.cis2.spineservices.nhs.uk:443/openam/oauth2/realms/root/realms/oidc/authorize`,
    body: {
      client_id: "128936811467.apps.national",
      client_secret: "1f88b870-9980-482a-95f4-395aaa01d699"
    }
  })
}

export async function refreshToken(data: ClientOAuth2.Data): Promise<ClientOAuth2.Token> {
  const oauthClientToken = createOAuthClient().createToken(data)
  const refreshedToken = await oauthClientToken.refresh()
  return refreshedToken
}

export function createOAuthCodeFlowClient(): OAuthClient {
  return createOAuthClient().code
}

export function createCIS2OAuthCodeFlowClient(): OAuthClient {
  return createCIS2OAuthClient().code
}
