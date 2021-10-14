import pino from "pino"
import Hapi from "hapi__hapi"
import {SandboxTrackerClient} from "./sandbox"
import {LiveTrackerClient} from "./live"
import {TrackerSpineResponse} from "./spine-model"

export interface TrackerClient {
  getPrescription(
    prescriptionId: string,
    headers: Hapi.Util.Dictionary<string>,
    logger: pino.Logger
  ): Promise<TrackerSpineResponse>
}

function getTrackerClient(liveMode: boolean): TrackerClient {
  return liveMode
    ? new LiveTrackerClient()
    : new SandboxTrackerClient()
}

export const trackerClient = getTrackerClient(process.env.SANDBOX !== "1")
