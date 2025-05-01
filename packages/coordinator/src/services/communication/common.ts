import {fhir, spine} from "@models"
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  RawAxiosRequestHeaders
} from "axios"
import pino from "pino"
import {StatusCheckResponse} from "../../utils/status"
import {addEbXmlWrapper} from "./ebxml-request-builder"
import {SpineClient} from "./spine-client"
import axiosRetry from "axios-retry"

// set polling timeout to be 25 seconds
const pollingTimeout = 25000
// set default polling delay to be 5 seconds if it is not in response
const defaultPollingDelay = 1000
const initialPollingDelay = 500

export const notSupportedOperationOutcome: fhir.OperationOutcome = {
  resourceType: "OperationOutcome",
  issue: [
    {
      code: fhir.IssueCodes.INFORMATIONAL,
      severity: "information",
      details: {
        coding: [
          {
            code: "INTERACTION_NOT_SUPPORTED",
            display: "Interaction not supported",
            system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
            version: "1"
          }
        ]
      }
    }
  ]
}

const timeoutOperationOutcome: fhir.OperationOutcome = {
  resourceType: "OperationOutcome",
  issue: [
    {
      code: fhir.IssueCodes.EXCEPTION,
      severity: "error",
      details: {
        coding: [
          {
            code: "TIMEOUT",
            display: "Timeout waiting for response",
            system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
            version: "1"
          }
        ]
      }
    }
  ]
}

export function notSupportedOperationOutcomePromise(): Promise<spine.SpineResponse<fhir.OperationOutcome>> {
  return Promise.resolve({
    statusCode: 400,
    body: notSupportedOperationOutcome
  })
}

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

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export abstract class BaseSpineClient implements SpineClient {
  protected readonly spineEndpoint: string
  protected readonly spinePath: string
  protected readonly ebXMLBuilder: (spineRequest: spine.SpineRequest) => string
  protected readonly axiosInstance: AxiosInstance
  private logger: pino.Logger

  constructor(
    spineEndpoint: string,
    spinePath: string,
    ebXMLBuilder: (spineRequest: spine.SpineRequest) => string = null,
    axiosConfig: object = {}
  ) {
    this.spineEndpoint = spineEndpoint
    this.spinePath = spinePath
    this.ebXMLBuilder = ebXMLBuilder || addEbXmlWrapper

    this.axiosInstance = axios.create(axiosConfig)
    axiosRetry(this.axiosInstance, {
      retries: 3,
      onRetry: this.onAxiosRetry,
      retryCondition: (error) => error.code !== "ECONNABORTED"
    })
  }

  protected prepareSpineRequest(req: spine.ClientRequest): {
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

  async send(req: spine.ClientRequest, fromAsid: string, logger: pino.Logger): Promise<spine.SpineResponse<unknown>> {
    this.logger = logger
    const {address, body, headers} = this.prepareSpineRequest(req)

    try {
      logger.info({headers}, `Attempting to send message to ${address}`)

      const response = await this.axiosInstance.post<string>(
        address,
        body,
        {
          headers: headers
        }
      )
      return await this.handlePollableOrImmediateResponse(response, logger, fromAsid, 0, 0)
    } catch (error) {
      let responseToLog
      if (error.response) {
        responseToLog = {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        }
      }
      logger.error({error, response: responseToLog}, `Failed post request for spine client send. Error: ${error}`)
      return this.handleError(error)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async poll(path: string, fromAsid: string, logger: pino.Logger): Promise<spine.SpineResponse<unknown>> {
    return notSupportedOperationOutcomePromise()
  }

  protected async handlePollableResponse(
    path: string,
    fromAsid: string,
    pollCount: number,
    totalPollingTime: number,
    logger: pino.Logger): Promise<spine.SpineResponse<unknown>> {
    const address = this.getSpineUrlForPolling(path)

    logger.info(`Attempting to send polling message to ${address}`)

    try {
      const result = await this.axiosInstance.get<string>(
        address,
        {
          headers: {
            "nhsd-asid": fromAsid
          }
        }
      )
      return await this.handlePollableOrImmediateResponse(
        result, logger, fromAsid, pollCount + 1, totalPollingTime, path
      )

    } catch (error) {
      let responseToLog
      if (error.response) {
        responseToLog = {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        }
      }
      logger.error({error, response: responseToLog}, `Failed polling request for polling path ${path}. Error: ${error}`)
      return this.handleError(error)
    }
  }

  protected async handlePollableOrImmediateResponse(
    result: AxiosResponse,
    logger: pino.Logger,
    fromAsid: string,
    pollCount: number,
    totalPollingTime: number,
    previousPollingUrl?: string
  ) {
    if (result.status === 200) {
      if (result.data !== "" && result.data !== undefined) {
        return this.handleImmediateResponse(result, logger)
      }
      logger.info("Empty body returned from spine - treating as 202 response")
    }

    if (result.status === 202 || result.status === 200) {
      if (totalPollingTime > pollingTimeout) {
        const errorMessage = `No response to poll after ${pollCount} attempts in ${totalPollingTime} milliseconds`
        logger.error({
          attempt: pollCount,
          totalPollingTime
        },
        errorMessage)
        return {
          body: timeoutOperationOutcome,
          statusCode: 500
        }
      }

      logger.info("Received pollable response")
      const contentLocation = result.headers["content-location"]
      const relativePollingUrl = contentLocation ? contentLocation : previousPollingUrl
      logger.info(`Got content location ${contentLocation}. Calling polling URL ${relativePollingUrl}`)
      if (previousPollingUrl) {
        totalPollingTime = totalPollingTime + defaultPollingDelay
        logger.info({
          defaultPollingDelay,
          attempt: pollCount,
          totalPollingTime
        },
        `Waiting ${defaultPollingDelay} milliseconds before polling again. Attempt ${pollCount}`)
        await delay(defaultPollingDelay)
      } else {
        totalPollingTime = totalPollingTime + initialPollingDelay
        logger.info({
          initialPollingDelay,
          attempt: 0,
          totalPollingTime
        },
        `First call, delay ${initialPollingDelay} milliseconds before checking result`)
        await delay(initialPollingDelay)
      }
      return await this.handlePollableResponse(relativePollingUrl, fromAsid, pollCount, totalPollingTime, logger)
    }

    logger.error({
      result: {headers: result.headers, data: result.data}
    }, "Received unexpected result from spine")
    throw Error(`Unsupported status, expected 200 or 202, got ${result.status}`)
  }

  protected handleImmediateResponse(
    result: AxiosResponse,
    logger: pino.Logger
  ) {
    logger.info("Successful request, returning SpineDirectResponse")
    return {
      body: result.data,
      statusCode: result.status
    }
  }

  protected handleError(error: Error): spine.SpineDirectResponse<unknown> {
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

  protected getSpineEndpoint(requestPath?: string) {
    if (requestPath && requestPath.startsWith("/")) {
      return `https://${this.spineEndpoint}${requestPath}`
    }
    return `https://${this.spineEndpoint}/${requestPath}`
  }

  protected getSpineUrlForPrescription(): string {
    return this.getSpineEndpoint(this.spinePath)
  }
  protected getSpineUrlForTracker(): string {
    return this.getSpineEndpoint("syncservice-mm/mm")
  }
  protected getSpineUrlForPolling(path: string): string {
    return this.getSpineEndpoint(path)
  }

  abstract getStatus(logger: pino.Logger): Promise<StatusCheckResponse>;

  onAxiosRetry = (retryCount: number, error: Error) => {
    this.logger.warn(error)
    this.logger.warn(`Call to spine failed - retrying. Retry count ${retryCount}`)
  }
}
