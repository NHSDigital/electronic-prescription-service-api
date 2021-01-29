import {LiveRequestHandler} from "./spine-handler"
import {SandboxRequestHandler} from "./sandbox-handler"
import {SpineRequest,SpineResponse} from "../../models/spine"
import {Logger} from "pino"

export interface RequestHandler {
  send(spineRequest: SpineRequest, xRequestIdHeader: string, logger: Logger): Promise<SpineResponse<unknown>>
  poll(path: string, logger: Logger): Promise<SpineResponse<unknown>>
}

function getHandler(liveMode: boolean): RequestHandler {
  return liveMode
    ? new LiveRequestHandler()
    : new SandboxRequestHandler()
}

export const requestHandler = getHandler(process.env.SANDBOX !== "1")
