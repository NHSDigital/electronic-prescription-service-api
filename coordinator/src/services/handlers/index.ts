import {LiveRequestHandler} from "./spine-handler"
import {SandboxRequestHandler} from "./sandbox-handler"
import {SpineRequest,SpineResponse} from "../../models/spine"
import {Level} from "pino"

export interface RequestHandler {
  send(spineRequest: SpineRequest, log: (tag: Level, message: string) => void): Promise<SpineResponse<unknown>>
  poll(path: string, log: (tag: Level, message: string) => void): Promise<SpineResponse<unknown>>
}

function getHandler(liveMode: boolean): RequestHandler {
  return liveMode
    ? new LiveRequestHandler()
    : new SandboxRequestHandler()
}

export const requestHandler = getHandler(process.env.SANDBOX !== "1")
