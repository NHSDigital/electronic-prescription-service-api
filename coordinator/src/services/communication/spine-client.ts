import {LiveSpineClient} from "./live-spine-client"
import {SandboxSpineClient} from "./sandbox-spine-client"
import {SpineRequest,SpineResponse} from "../../models/spine"
import {Logger} from "pino"

export interface SpineClient {
  send(spineRequest: SpineRequest, logger: Logger): Promise<SpineResponse<unknown>>
  poll(path: string, logger: Logger): Promise<SpineResponse<unknown>>
}

function getSpineClient(liveMode: boolean): SpineClient {
  return liveMode
    ? new LiveSpineClient()
    : new SandboxSpineClient()
}

export const spineClient = getSpineClient(process.env.SANDBOX !== "1")
