import {spine} from "@models"
import pino from "pino"
import {serviceHealthCheck, StatusCheckResponse} from "../../utils/status"
import {BaseSpineClient} from "./common"

export class LiveSpineClient extends BaseSpineClient {
  private static readonly SPINE_PATH = "Prescription"

  constructor(
    spineEndpoint: string = process.env.SPINE_URL,
    spinePath: string = LiveSpineClient.SPINE_PATH,
    ebXMLBuilder: (spineRequest: spine.SpineRequest) => string = null
  ) {
    super(spineEndpoint, spinePath, ebXMLBuilder)
  }

  async getStatus(logger: pino.Logger): Promise<StatusCheckResponse> {
    const url = this.getSpineEndpoint(`healthcheck`)
    return serviceHealthCheck(url, logger, undefined)
  }
}
