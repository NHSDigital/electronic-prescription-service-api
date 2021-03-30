import {LiveSpineClient} from "./live-spine-client"
import {SandboxSpineClient} from "./sandbox-spine-client"
import {spine} from "@models"
import {Logger} from "pino"

export interface SpineClient {
  send(spineRequest: spine.SpineRequest, logger: Logger): Promise<spine.SpineResponse<unknown>>
  poll(path: string, logger: Logger): Promise<spine.SpineResponse<unknown>>
}

function getSpineClient(liveMode: boolean): SpineClient {
  return liveMode
    ? new LiveSpineClient()
    : new SandboxSpineClient()
}

export const spineClient = getSpineClient(process.env.SANDBOX !== "1")
