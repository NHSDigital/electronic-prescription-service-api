import {TrackerClient, WeirdJsonResponse} from "."
import pino from "pino"

export class SandboxTrackerClient implements TrackerClient {
  getPrescription(prescriptionId: string, logger: pino.Logger): Promise<WeirdJsonResponse> {
    return
  }
}

