import ClientOAuth2 from "client-oauth2"
import {URL} from "url"
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
    clientId: process.env.DEMO_APP_CLIENT_ID,
    clientSecret: process.env.DEMO_APP_CLIENT_KEY,
    redirectUri: getRegisteredCallbackUrl("callback"),
    accessTokenUri: `https://${process.env.APIGEE_DOMAIN_NAME}/apigee/oauth2/token`,
    authorizationUri: `https://${process.env.APIGEE_DOMAIN_NAME}/authorize`,
    body: {
      client_id: process.env.DEMO_APP_CLIENT_ID ?? "",
      client_secret: process.env.DEMO_APP_CLIENT_KEY ?? ""
    }
  }).code
}
