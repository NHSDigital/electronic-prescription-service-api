import {spine} from "@models"

import pino from "pino"
import {serviceHealthCheck, StatusCheckResponse} from "../../utils/status"

import {Agent} from "https"
import {BaseSpineClient} from "./common"

const SPINE_URL_SCHEME = "https"

export class MtlsSpineClient extends BaseSpineClient {
  private static readonly SPINE_PATH = "Prescription"
  private readonly httpsAgent: Agent

  constructor(
    spineEndpoint: string = process.env.TARGET_SPINE_SERVER,
    spinePath: string = MtlsSpineClient.SPINE_PATH,
    ebXMLBuilder: (spineRequest: spine.SpineRequest) => string = null,
    logger: pino.Logger = null
  ) {
    const privateKey = process.env.SpinePrivateKey
    const publicCert = process.env.SpinePublicCertificate
    const caChain = process.env.SpineCAChain

    const httpsAgent = new Agent({
      key: privateKey,
      cert: publicCert,
      ca: caChain,
      rejectUnauthorized: true,
      keepAlive: true
    })

    super(spineEndpoint, spinePath, ebXMLBuilder, logger, {httpsAgent})
    this.httpsAgent = httpsAgent
  }

  protected getSpineUrlForPrescription(): string {
    return this.getSpineEndpoint(this.spinePath)
  }

  protected getSpineUrlForTracker(): string {
    return this.getSpineEndpoint("syncservice-mm/mm")
  }

  protected getSpineUrlForPolling(path: string): string {
    return `${SPINE_URL_SCHEME}://${this.spineEndpoint}${path}`
  }

  private getSpineEndpoint(requestPath?: string) {
    const sanitizedPath = requestPath ? encodeURIComponent(requestPath) : ""
    return `${SPINE_URL_SCHEME}://${this.spineEndpoint}/${sanitizedPath}`
  }

  async getStatus(logger: pino.Logger): Promise<StatusCheckResponse> {
    const url = this.getSpineEndpoint(`healthcheck`)
    return serviceHealthCheck(url, logger, this.httpsAgent)
  }
}
