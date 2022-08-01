import pino from "pino"
import Hapi from "hapi__hapi"
import {SandboxTrackerClient} from "./sandbox"
import {LiveTrackerClient} from "./live"
import {spine} from "@models"

export interface TrackerClient {
  getPrescriptionsByPatientId(
    patientId: string,
    businessStatus: string,
    earliestDate: string,
    latestDate: string,
    headers: Hapi.Util.Dictionary<string>,
    logger: pino.BaseLogger
  ): Promise<spine.SummaryTrackerResponse>
  getPrescriptionById(
    prescriptionId: string,
    headers: Hapi.Util.Dictionary<string>,
    logger: pino.BaseLogger
  ): Promise<spine.DetailTrackerResponse>
}

function getTrackerClient(liveMode: boolean): TrackerClient {
  return liveMode
    ? new LiveTrackerClient()
    : new SandboxTrackerClient()
}

export const trackerClient = getTrackerClient(process.env.SANDBOX !== "1")
