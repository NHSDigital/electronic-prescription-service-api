import {spine} from "@models"

import pino from "pino"
import {serviceHealthCheck, StatusCheckResponse} from "../../utils/status"

import {BaseSpineClient} from "./common"

const SPINE_URL_SCHEME = "https"

export class LiveSpineClient extends BaseSpineClient {
  private static readonly SPINE_PATH = "Prescription"

  constructor(
    spineEndpoint: string = process.env.SPINE_URL,
    spinePath: string = LiveSpineClient.SPINE_PATH,
    ebXMLBuilder: (spineRequest: spine.SpineRequest) => string = null,
    logger: pino.Logger = null
  ) {
    super(spineEndpoint, spinePath, ebXMLBuilder, logger)
  }

  protected getSpineUrlForPrescription(): string {
    return this.getSpineEndpoint(this.spinePath)
  }

  protected getSpineUrlForTracker(): string {
    return this.getSpineEndpoint("syncservice-mm/mm")
  }

  protected getSpineUrlForPolling(path: string): string {
    return this.getSpineEndpoint(path.substring(1))
  }

  private getSpineEndpoint(requestPath?: string) {
    if (requestPath && requestPath.startsWith("/")) {
      return `${SPINE_URL_SCHEME}://${this.spineEndpoint}${requestPath}`
    }
    return `${SPINE_URL_SCHEME}://${this.spineEndpoint}/${requestPath}`
  }

  async getStatus(logger: pino.Logger): Promise<StatusCheckResponse> {
    const url = this.getSpineEndpoint(`healthcheck`)
    return serviceHealthCheck(url, logger, undefined)
  }
}
