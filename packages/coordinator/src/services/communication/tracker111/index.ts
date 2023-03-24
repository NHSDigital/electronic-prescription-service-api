import pino from "pino"
import Hapi from "@hapi/hapi"
import {SandboxTrackerClient} from "./sandbox"
import {LiveTrackerClient} from "./live"
import {spine} from "@models"

export interface TrackerClient {
  getPrescriptionsByPatientId(
    patientId: string,
    businessStatus: string,
    earliestDate: string,
    latestDate: string,
    headers: Hapi.Utils.Dictionary<string>,
    logger: pino.Logger
  ): Promise<spine.SummaryTrackerResponse>
  getPrescriptionById(
    prescriptionId: string,
    headers: Hapi.Utils.Dictionary<string>,
    logger: pino.Logger
  ): Promise<spine.DetailTrackerResponse>
}

function getTrackerClient(liveMode: boolean): TrackerClient {
  return liveMode
    ? new LiveTrackerClient()
    : new SandboxTrackerClient()
}

export const trackerClient = getTrackerClient(process.env.SANDBOX !== "1")
