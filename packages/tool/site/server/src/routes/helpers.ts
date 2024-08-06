import Boom from "@hapi/boom"
import * as pino from "pino"
import {CONFIG} from "../config"

export const base64Encode = (data: string): string => Buffer.from(data, "utf-8").toString("base64")
export const base64Decode = (data: string): string => Buffer.from(data, "base64").toString("utf-8")

export interface OAuthState {
  prNumber?: number
}

export function createOAuthState(): string {
  const stateObj: OAuthState = {
    prNumber: getPrNumber(CONFIG.basePath)
  }
  return base64Encode(JSON.stringify(stateObj))
}

export function parseOAuthState(state: string, logger: pino.Logger): OAuthState {
  try {
    const decodedState = Buffer.from(state, "base64").toString("utf-8")
    return JSON.parse(decodedState)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    logger.error(`Invalid client state was returned from auth provider. Got: ${state}`)
    throw Boom.badRequest()
  }
}

export function getPrNumber(basePath: string): number | undefined {
  if (!basePath.startsWith("eps-api-tool-pr-")) {
    return undefined
  }
  const prNumberStr = basePath.substring("eps-api-tool-pr-".length)
  return parseInt(prNumberStr)
}

export function prRedirectEnabled(): boolean {
  return CONFIG.environment === "internal-dev"
}

export function getRegisteredCallbackUrl(endpoint: string): string {
  return prRedirectEnabled()
    ? `${CONFIG.publicApigeeHost}/eps-api-tool/${endpoint}`
    : `${CONFIG.publicApigeeHost}/${CONFIG.basePath}/${endpoint}`
}

export function prRedirectRequired(
  requestPrNumber: number | undefined
): boolean {
  return requestPrNumber !== getPrNumber(CONFIG.basePath)
}

export function getPrBranchUrl(
  requestPrNumber: number | undefined,
  endpoint: string,
  queryString: string,
): string {
  const basePath = "https://internal-dev.api.service.nhs.uk"
  return `${basePath}/eps-api-tool-pr-${requestPrNumber}/${endpoint}?${queryString}`
}
