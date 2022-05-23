import {Environment} from "./services/environment"

export interface Config {
  commitId: string
  validatorVersion: string
  basePath: string
  baseUrl: string
  environment: Environment
  sessionKey: string
  privateApigeeUrl: string
  publicApigeeUrl: string
  combinedAuthClientId: string
  combinedAuthClientSecret: string
  privateKey: string
  keyId: string
  subject: string
  separateAuthClientId: string
  separateAuthClientSecret: string
  cis2EgressHost: string
  refreshTokenTimeout: number
}

export const CONFIG: Config = {
  commitId: process.env.COMMIT_ID ?? "unknown",
  validatorVersion: process.env.VALIDATOR_VERSION ?? "unknown",
  basePath: process.env.BASE_PATH ?? "eps-api-tool",
  baseUrl: process.env.BASE_PATH ? `/${process.env.BASE_PATH}/` : "/",
  environment: process.env.ENVIRONMENT as Environment ?? "int",
  sessionKey: process.env.SESSION_TOKEN_ENCRYPTION_KEY ?? "",
  privateApigeeUrl: `https://${process.env.APIGEE_DOMAIN_NAME}`,
  publicApigeeUrl: process.env.PUBLIC_APIGEE_URL ?? "",
  combinedAuthClientId: process.env.COMBINED_AUTH_CLIENT_ID ?? "",
  combinedAuthClientSecret: process.env.COMBINED_AUTH_CLIENT_KEY ?? "",
  privateKey: process.env.DEMO_APP_PRIVATE_KEY ?? "",
  keyId: process.env.DEMO_APP_KEY_ID ?? "",
  subject: process.env.APP_JWT_SUBJECT ?? "",
  separateAuthClientId: process.env.SEPARATE_AUTH_CLIENT_ID ?? "",
  separateAuthClientSecret: process.env.SEPARATE_AUTH_CLIENT_KEY ?? "",
  cis2EgressHost: process.env.CIS2_EGRESS_HOST ?? "",
  // full refresh timeout seconds is divided by 3 as only one refresh is working atm
  // times by 1000 to get miliseconds as ttls for cookies takes ms
  refreshTokenTimeout: (3599 / 3) * 1000
}
