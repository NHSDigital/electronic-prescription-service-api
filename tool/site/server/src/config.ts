export interface Config {
  commitId: string
  basePath: string
  baseUrl: string
  environment: string
  sessionKey: string
  privateApigeeUrl: string
  publicApigeeUrl: string
  clientId: string
  clientSecret: string
  privateKey: string
  keyId: string
  subject: string
  rssPrivateKey: string
  rssKeyId: string
  rssIssuer: string
}

export const CONFIG: Config = {
  commitId: process.env.COMMIT_ID ?? "unknown",
  basePath: process.env.BASE_PATH ?? "eps-api-tool",
  baseUrl: process.env.BASE_PATH ? `/${process.env.BASE_PATH}/` : "/",
  environment: process.env.ENVIRONMENT ?? "int",
  sessionKey: process.env.SESSION_TOKEN_ENCRYPTION_KEY ?? "",
  privateApigeeUrl: `https://${process.env.APIGEE_DOMAIN_NAME}`,
  publicApigeeUrl: process.env.PUBLIC_APIGEE_URL ?? "",
  clientId: process.env.DEMO_APP_CLIENT_ID ?? "",
  clientSecret: process.env.DEMO_APP_CLIENT_KEY ?? "",
  privateKey: process.env.DEMO_APP_PRIVATE_KEY || "",
  keyId: process.env.DEMO_APP_KEY_ID ?? "",
  subject: process.env.APP_JWT_SUBJECT ?? "",
  rssPrivateKey: process.env.APP_JWT_PRIVATE_KEY ?? "",
  rssKeyId: process.env.DEMO_APP_REMOTE_SIGNING_KID ?? "",
  rssIssuer: process.env.DEMO_APP_REMOTE_SIGNING_ISSUER ?? ""
}
