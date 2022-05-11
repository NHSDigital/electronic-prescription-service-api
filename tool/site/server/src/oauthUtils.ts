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
    clientSecret: CONFIG.clientSecret,
    redirectUri: getRegisteredCallbackUrl("callback"),
    accessTokenUri: `https://am.nhsint.auth-ptl.cis2.spineservices.nhs.uk:443/openam/oauth2/realms/root/realms/NHSIdentity/realms/Healthcare/access_token`,
    authorizationUri: `https://am.nhsint.auth-ptl.cis2.spineservices.nhs.uk:443/openam/oauth2/realms/root/realms/NHSIdentity/realms/Healthcare/authorize`,
    body: {
      response_type: "code",
      scope: "openid%20profile",
      client_id: "128936811467.apps.national",
      redirect_uri: "https://int.api.service.nhs.uk/eps-api-tool/callback",
      state: "af0ifjsldkj"
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

export function createCIS2OAuthCodeFlowClient(): ClientOAuth2.CodeFlow {
  return createCIS2OAuthClient().code
}
