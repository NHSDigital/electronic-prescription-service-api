import {SpineHandler} from "./spine-handler"
import {SandboxHandler} from "./sandbox-handler"
import {SpineResponse} from "../../models/spine/responses"

export interface Handler {
    send(message: string): Promise<SpineResponse>
    poll(path: string): Promise<SpineResponse>
}

function getHandler(liveMode: boolean): Handler {
  return liveMode
    ? new SpineHandler()
    : new SandboxHandler()
}

export const requestHandler = getHandler(process.env.SANDBOX !== "1")
