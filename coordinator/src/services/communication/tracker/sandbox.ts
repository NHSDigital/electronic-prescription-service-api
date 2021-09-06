import {TrackerClient, DetailTrackerResponse} from "."
import pino from "pino"
import Hapi from "@hapi/hapi"

export class SandboxTrackerClient implements TrackerClient {
  getPrescription(
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    prescriptionId: string, headers: Hapi.Util.Dictionary<string>, logger: pino.Logger
  ): Promise<DetailTrackerResponse> {
    return
  }
}

