import {spine} from "@models"
import pino from "pino"
import {StatusCheckResponse} from "../../utils/status"
import {LiveSpineClient} from "./live-spine-client"
import {SandboxSpineClient} from "./sandbox-spine-client"
import {MtlsSpineClient} from "./mtls-spine-client"

export interface SpineClient {
  send(request: spine.ClientRequest, logger: pino.Logger): Promise<spine.SpineResponse<unknown>>
  poll(path: string, fromAsid: string, logger: pino.Logger): Promise<spine.SpineResponse<unknown>>
  getStatus(logger: pino.Logger): Promise<StatusCheckResponse>
}

export function getSpineClient(useMtlsSpineClient: boolean, liveMode: boolean): SpineClient {
  if (useMtlsSpineClient) {
    return new MtlsSpineClient()
  }

  return liveMode ? new LiveSpineClient() : new SandboxSpineClient()
}

const useMtlsSpineClient = process.env.MTLS_SPINE_CLIENT === "1"
const liveMode = process.env.SANDBOX !== "1"

export const spineClient = getSpineClient(useMtlsSpineClient, liveMode)
