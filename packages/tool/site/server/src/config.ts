import {Environment} from "./services/environment"

export interface Config {
  commitId: string
  validatorVersion: string
  basePath: string
  baseUrl: string
  environment: Environment
  sessionKey: string
  publicApigeeHost: string
  apigeeEgressHost: string
  apigeeAppClientId: string
  apigeeAppClientSecret: string
  apigeeAppJWTPrivateKey: string
  apigeeAppJWTKeyId: string
  subject: string
  cis2EgressHost: string
  cis2AppClientId: string
  cis2AppClientSecret: string
  refreshTokenTimeout: number
}

export const CONFIG: Config = {
  commitId: process.env.COMMIT_ID ?? "unknown",
  validatorVersion: process.env.VALIDATOR_VERSION ?? "unknown",
  basePath: process.env.BASE_PATH ?? "eps-api-tool",
  baseUrl: process.env.BASE_PATH ? `/${process.env.BASE_PATH}/` : "/",
  environment: (process.env.ENVIRONMENT as Environment) ?? "int",
  sessionKey: process.env.SESSION_TOKEN_ENCRYPTION_KEY ?? "",
  publicApigeeHost: process.env.PUBLIC_APIGEE_URL ?? "",
  apigeeEgressHost: `https://${process.env.APIGEE_DOMAIN_NAME}`,
  apigeeAppClientId: process.env.APIGEE_APP_CLIENT_ID ?? "",
  apigeeAppClientSecret: process.env.APIGEE_APP_CLIENT_SECRET ?? "",
  apigeeAppJWTPrivateKey: process.env.APIGEE_APP_JWT_PRIVATE_KEY ?? "",
  apigeeAppJWTKeyId: process.env.APIGEE_APP_JWT_KEY_ID ?? "",
  subject: process.env.APP_JWT_SUBJECT ?? "",
  cis2EgressHost: process.env.CIS2_EGRESS_HOST ?? "",
  cis2AppClientId: process.env.CIS2_APP_CLIENT_ID ?? "",
  cis2AppClientSecret: process.env.CIS2_APP_CLIENT_SECRET ?? "",
  // full refresh timeout seconds is divided by 3 as only one refresh is working atm
  // times by 1000 to get milliseconds as ttls for cookies takes ms
  refreshTokenTimeout: (3599 / 3) * 1000
}
