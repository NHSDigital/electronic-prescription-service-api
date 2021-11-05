import pino from "pino"
import Hapi from "hapi__hapi"
import {SandboxTrackerClient} from "./sandbox"
import {LiveTrackerClient} from "./live"
import {DetailTrackerResponse, SummaryTrackerResponse} from "./spine-model"

export interface TrackerClient {
  getPrescriptions(
    patientId: string,
    headers: Hapi.Util.Dictionary<string>,
    logger: pino.Logger
  ): Promise<SummaryTrackerResponse>
  getPrescription(
    prescriptionId: string,
    headers: Hapi.Util.Dictionary<string>,
    logger: pino.Logger
  ): Promise<DetailTrackerResponse>
}

function getTrackerClient(liveMode: boolean): TrackerClient {
  return liveMode
    ? new LiveTrackerClient()
    : new SandboxTrackerClient()
}

export const trackerClient = getTrackerClient(process.env.SANDBOX !== "1")
