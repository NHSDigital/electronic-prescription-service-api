import {spine} from "@models"
import axios, {AxiosError, AxiosResponse, RawAxiosRequestHeaders} from "axios"
import pino from "pino"
import {serviceHealthCheck, StatusCheckResponse} from "../../utils/status"
import {addEbXmlWrapper} from "./ebxml-request-builder"
import {SpineClient} from "./spine-client"
import {Agent} from "https"

const SPINE_URL_SCHEME = "https"
const SPINE_ENDPOINT = process.env.TARGET_SPINE_SERVER
const SPINE_PATH = "Prescription"
const BASE_PATH = process.env.BASE_PATH

const getClientRequestHeaders = (interactionId: string, messageId: string) => {
  return {
    "Content-Type": "multipart/related;" +
      " boundary=\"--=_MIME-Boundary\";" +
      " type=text/xml;" +
      " start=ebXMLHeader@spine.nhs.uk",
    "SOAPAction": `urn:nhs:names:services:mm/${interactionId}`,
    "NHSD-Request-ID": messageId
  }
}

export class MtlsSpineClient implements SpineClient {
  private readonly spineEndpoint: string
  private readonly spinePath: string
  private readonly ebXMLBuilder: (spineRequest: spine.SpineRequest) => string
  private httpsAgent: Agent

  constructor(
    spineEndpoint: string = null,
    spinePath: string = null,
    ebXMLBuilder: (spineRequest: spine.SpineRequest) => string = null
  ) {
    this.spineEndpoint = spineEndpoint || SPINE_ENDPOINT
    this.spinePath = spinePath || SPINE_PATH
    this.ebXMLBuilder = ebXMLBuilder || addEbXmlWrapper

    this.initHttpsAgent()
  }

  private initHttpsAgent() {
    const privateKey = process.env.SpinePrivateKey
    const publicCert = process.env.SpinePublicCertificate
    const caChain = process.env.SpineCAChain

    this.httpsAgent = new Agent({
      key: privateKey,
      cert: publicCert,
      ca: caChain,
      rejectUnauthorized: true
    })
  }

  private prepareSpineRequest(req: spine.ClientRequest): {
    address: string,
    body: string,
    headers: RawAxiosRequestHeaders
  } {
    if (spine.isTrackerRequest(req)) {
      return {
        address: this.getSpineUrlForTracker(),
        body: req.body,
        headers: req.headers
      }
    } else {
      return {
        address: this.getSpineUrlForPrescription(),
        body: this.ebXMLBuilder(req),
        headers: getClientRequestHeaders(req.interactionId, req.messageId)
      }
    }
  }

  async send(req: spine.ClientRequest, logger: pino.Logger): Promise<spine.SpineResponse<unknown>> {
    const {address, body, headers} = this.prepareSpineRequest(req)

    try {
      logger.info(`Attempting to send message to ${address}`)

      const response = await axios.post<string>(
        address,
        body,
        {
          headers: headers,
          httpsAgent: this.httpsAgent
        }
      )
      return MtlsSpineClient.handlePollableOrImmediateResponse(response, logger)
    } catch (error) {
      logger.error(`Failed post request for spine client send. Error: ${error}`)
      return MtlsSpineClient.handleError(error)
    }
  }

  async poll(path: string, fromAsid: string, logger: pino.Logger): Promise<spine.SpineResponse<unknown>> {
    const address = this.getSpineUrlForPolling(path)

    logger.info(`Attempting to send polling message to ${address}`)

    try {
      const result = await axios.get<string>(
        address,
        {
          headers: {
            "nhsd-asid": fromAsid
          },
          httpsAgent: this.httpsAgent
        }
      )
      return MtlsSpineClient.handlePollableOrImmediateResponse(result, logger, `/_poll/${path}`)
    } catch (error) {
      logger.error(`Failed polling request for polling path ${path}. Error: ${error}`)
      return MtlsSpineClient.handleError(error)
    }
  }

  private static handlePollableOrImmediateResponse(
    result: AxiosResponse,
    logger: pino.Logger,
    previousPollingUrl?: string
  ) {
    if (result.status === 200) {
      return this.handleImmediateResponse(result, logger)
    }

    if (result.status === 202) {
      logger.info("Successful request, returning SpinePollableResponse")
      const contentLocation = result.headers["content-location"]
      const relativePollingUrl = contentLocation ? contentLocation : previousPollingUrl
      logger.info(`Got content location ${contentLocation}. Using polling URL ${relativePollingUrl}`)
      return {
        pollingUrl: `${BASE_PATH}${relativePollingUrl}`,
        statusCode: result.status
      }
    }

    logger.error(`Got the following response from spine:\n${result.data}`)
    throw Error(`Unsupported status, expected 200 or 202, got ${result.status}`)
  }

  private static handleImmediateResponse(
    result: AxiosResponse,
    logger: pino.Logger
  ) {
    logger.info("Successful request, returning SpineDirectResponse")
    return {
      body: result.data,
      statusCode: result.status
    }
  }

  private static handleError(error: Error): spine.SpineDirectResponse<unknown> {
    const axiosError = error as AxiosError
    if (axiosError.response) {
      return {
        body: axiosError.response.data,
        statusCode: axiosError.response.status
      }
    } else {
      return {
        body: axiosError.message,
        statusCode: 500
      }
    }
  }

  private getSpineEndpoint(requestPath?: string) {
    const sanitizedPath = requestPath ? encodeURIComponent(requestPath) : ""
    return `${SPINE_URL_SCHEME}://${this.spineEndpoint}/${sanitizedPath}`
  }

  private getSpineUrlForPrescription() {
    return this.getSpineEndpoint(this.spinePath)
  }

  private getSpineUrlForTracker() {
    return this.getSpineEndpoint("syncservice-mm/mm")
  }

  private getSpineUrlForPolling(path: string) {
    const sanitizedPath = encodeURIComponent(path)
    return this.getSpineEndpoint(`_poll/${sanitizedPath}`)
  }

  async getStatus(logger: pino.Logger): Promise<StatusCheckResponse> {
    const url = this.getSpineEndpoint(`healthcheck`)
    return serviceHealthCheck(url, logger, this.httpsAgent)
  }
}
