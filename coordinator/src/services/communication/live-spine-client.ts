import axios, {AxiosError, AxiosResponse} from "axios"
import https from "https"
import {Logger} from "pino"
import {SpineClient} from "."
import {SpineRequest, SpineResponse} from "../../models/spine"
import {addEbXmlWrapper} from "./ebxml-request-builder"

const SPINE_URL_SCHEME = "https"
const SPINE_ENDPOINT = process.env.SPINE_URL
const SPINE_PATH = "Prescription"
const BASE_PATH = process.env.BASE_PATH

const httpsAgent = new https.Agent({
  cert: process.env.CLIENT_CERT,
  key: process.env.CLIENT_KEY,
  ca: [
    process.env.ROOT_CA_CERT,
    process.env.SUB_CA_CERT
  ]
})

export class LiveSpineClient implements SpineClient {
  private readonly spineEndpoint: string
  private readonly spinePath: string
  private readonly ebXMLBuilder: (spineRequest: SpineRequest) => string

  constructor(
    spineEndpoint: string = null,
    spinePath: string = null,
    ebXMLBuilder: (spineRequest: SpineRequest) => string = null
  ) {
    this.spineEndpoint = spineEndpoint || SPINE_ENDPOINT
    this.spinePath = spinePath || SPINE_PATH
    this.ebXMLBuilder = ebXMLBuilder || addEbXmlWrapper
  }

  async send(spineRequest: SpineRequest, logger: Logger): Promise<SpineResponse<unknown>> {
    const wrappedMessage = this.ebXMLBuilder(spineRequest)
    const address = this.getSpineUrlForPrescription()

    logger.info(`Attempting to send message to ${address}`)

    try {
      const result = await axios.post<string>(
        address,
        wrappedMessage,
        {
          httpsAgent,
          headers: {
            "Content-Type": "multipart/related;" +
              " boundary=\"--=_MIME-Boundary\";" +
              " type=text/xml;" +
              " start=ebXMLHeader@spine.nhs.uk",
            "SOAPAction": `urn:nhs:names:services:mm/${spineRequest.interactionId}`,
            "NHSD-Request-ID": spineRequest.messageId
          }
        }
      )
      return LiveSpineClient.handlePollableOrImmediateResponse(result, logger)
    } catch (error) {
      logger.error(`Failed post request for prescription message. Error: ${error}`)
      return LiveSpineClient.handleError(error)
    }
  }

  async poll(path: string, logger: Logger): Promise<SpineResponse<unknown>> {
    const address = this.getSpineUrlForPolling(path)

    logger.info(`Attempting to send polling message to ${address}`)

    try {
      const result = await axios.get<string>(
        address,
        {
          httpsAgent,
          headers: {"nhsd-asid": process.env.FROM_ASID}
        }
      )
      return LiveSpineClient.handlePollableOrImmediateResponse(result, logger)
    } catch (error) {
      logger.error(`Failed polling request for polling path ${path}. Error: ${error}`)
      return LiveSpineClient.handleError(error)
    }
  }

  private static handlePollableOrImmediateResponse(result: AxiosResponse, logger: Logger) {
    switch (result.status) {
      case (200):
        logger.info("Successful request, returning SpineDirectResponse")
        return {
          body: result.data,
          statusCode: result.status
        }
      case (202):
        logger.info("Successful request, returning SpinePollableResponse")
        logger.info(`Got polling URL ${result.headers["content-location"]}`)
        return {
          statusCode: result.status,
          pollingUrl: `${BASE_PATH}${result.headers["content-location"]}`
        }
      default:
        logger.error(`Got the following response from spine:\n${result.data}`)
        throw Error(`Unsupported status, expected 200 or 202, got ${result.status}`)
    }
  }

  private static handleError(error: Error): SpineResponse<unknown> {
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

  private getSpineUrlForPrescription() {
    if (this.spineEndpoint.includes("ref")) {
      return `${SPINE_URL_SCHEME}://${this.spineEndpoint.replace(/msg/g, "prescriptions")}/${this.spinePath}`
    }

    return `${SPINE_URL_SCHEME}://${this.spineEndpoint}/${this.spinePath}`
  }

  private getSpineUrlForPolling(path: string) {
    if (this.spineEndpoint.includes("ref")) {
      return `${SPINE_URL_SCHEME}://${this.spineEndpoint.replace(/msg/g, "prescriptions")}/_poll/${path}`
    }

    return `${SPINE_URL_SCHEME}://${this.spineEndpoint}/_poll/${path}`
  }
}
