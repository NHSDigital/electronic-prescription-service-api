import {LiveSpineClient} from "./live-spine-client"
import {SandboxSpineClient} from "./sandbox-spine-client"
import {spine} from "@models"
import pino from "pino"
import {StatusCheckResponse} from "../../utils/status"

export interface SpineClient {
  send(spineRequest: spine.SpineRequest, logger: pino.Logger): Promise<spine.SpineResponse<unknown>>
  poll(path: string, fromAsid: string, logger: pino.Logger): Promise<spine.SpineResponse<unknown>>
  getStatus(logger: pino.Logger): Promise<StatusCheckResponse>
}

function getSpineClient(liveMode: boolean): SpineClient {
  return liveMode
    ? new LiveSpineClient()
    : new SandboxSpineClient()
}

export const spineClient = getSpineClient(process.env.SANDBOX !== "1")
