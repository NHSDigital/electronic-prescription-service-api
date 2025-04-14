import {spine} from "@models"
import pino from "pino"
import {Agent} from "https"
import {serviceHealthCheck, StatusCheckResponse} from "../../utils/status"
import {BaseSpineClient} from "./common"

export class MtlsSpineClient extends BaseSpineClient {
  private static readonly SPINE_PATH = "Prescription"
  private readonly httpsAgent: Agent

  constructor(
    spineEndpoint: string = process.env.TARGET_SPINE_SERVER,
    spinePath: string = MtlsSpineClient.SPINE_PATH,
    ebXMLBuilder: (spineRequest: spine.SpineRequest) => string = null
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

    super(spineEndpoint, spinePath, ebXMLBuilder, {httpsAgent})
    this.httpsAgent = httpsAgent
  }

  async getStatus(logger: pino.Logger): Promise<StatusCheckResponse> {
    const url = this.getSpineEndpoint(`healthcheck`)
    return serviceHealthCheck(url, logger, this.httpsAgent)
  }
}
