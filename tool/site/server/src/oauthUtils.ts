import ClientOAuth2 from "client-oauth2"
import {URL} from "url"
import {CONFIG} from "./config"
import {getRegisteredCallbackUrl} from "./routes/helpers"

export interface OAuthClient {
  getUri: (options?: ClientOAuth2.Options) => string
  getToken: (uri: URL) => Promise<Token>
}

export interface Token {
  tokenType: string,
  accessToken: string,
  refreshToken: string
}

export default function createOAuthClient(): OAuthClient {
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
  }).code
}
