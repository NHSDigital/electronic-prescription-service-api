import {TrackerClient, WeirdJsonResponse} from "."
import pino from "pino"
import Hapi from "@hapi/hapi"

export class SandboxTrackerClient implements TrackerClient {
  getPrescription(
    prescriptionId: string,
    headers: Hapi.Util.Dictionary<string>,
    logger: pino.Logger
  ): Promise<WeirdJsonResponse> {
    return
  }
}

