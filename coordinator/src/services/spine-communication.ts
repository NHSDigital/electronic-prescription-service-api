import axios, {AxiosError, AxiosResponse} from "axios"
import https from "https"
import {addEbXmlWrapper} from "./request-builder"
import {Hl7InteractionIdentifier} from "../model/hl7-v3-datatypes-codes"
import {OperationOutcome} from "../model/fhir-resources"

const SPINE_ENDPOINT = process.env.SPINE_ENV === "INT" ? process.env.INT_SPINE_URL : process.env.TEST_SPINE_URL
const SPINE_PATH = "/Prescription"
const SPINE_URL_SCHEME = "https"

export interface SpineRequest {
  message: string
  interactionId: string
}

type SpineResponse<T> = SpineDirectResponse<T> | SpinePollableResponse

export interface SpineDirectResponse<T> {
  body: T
  statusCode: number
}

export interface SpinePollableResponse {
  pollingUrl: string
  statusCode: number
}

export function isDirect<T>(spineResponse: SpineResponse<T>): spineResponse is SpineDirectResponse<T> {
  return !isPollable(spineResponse)
}

export function isPollable<T>(spineResponse: SpineResponse<T>): spineResponse is SpinePollableResponse {
  return "pollingUrl" in spineResponse
}

const httpsAgent = new https.Agent({
  cert: process.env.CLIENT_CERT,
  key: process.env.CLIENT_KEY,
  ca: [
    process.env.ROOT_CA_CERT,
    process.env.SUB_CA_CERT
  ]
})

export interface RequestHandler {
  send(spineRequest: SpineRequest): Promise<SpineResponse<unknown>>
  poll(path: string): Promise<SpineResponse<unknown>>
}

export class SandboxRequestHandler implements RequestHandler {
  parentPrescriptionPollingId = "9807d292_074a_49e8_b48d_52e5bbf785ed"
  cancellationPollingId = "a549d4d6_e6aa_4664_95f8_6c0cac17bd77"

  async send(spineRequest: SpineRequest): Promise<SpineResponse<string>> {
    if (spineRequest.interactionId === Hl7InteractionIdentifier.PARENT_PRESCRIPTION_URGENT._attributes.extension) {
      return Promise.resolve({
        pollingUrl: `_poll/${this.parentPrescriptionPollingId}`,
        statusCode: 202
      })
    } else if (spineRequest.interactionId === Hl7InteractionIdentifier.CANCEL_REQUEST._attributes.extension) {
      return Promise.resolve({
        pollingUrl: `_poll/${this.cancellationPollingId}`,
        statusCode: 202
      })
    } else {
      return Promise.resolve({
        body: "Interaction not supported by sandbox",
        statusCode: 400
      })
    }
  }

  async poll(path: string): Promise<SpineResponse<string | OperationOutcome>> {
    if (path === this.parentPrescriptionPollingId) {
      //TODO - add realistic response
      return {
        statusCode: 200,
        body: "Prescription Message Sent"
      }
    } else if (path === this.cancellationPollingId) {
      //TODO - add realistic response
      return {
        statusCode: 200,
        body: "Cancellation Message Sent"
      }
    } else {
      const notFoundOperationOutcome: OperationOutcome = {
        resourceType: "OperationOutcome",
        issue: [
          {
            code: "informational",
            severity: "information",
            details: {
              coding: [
                {
                  code: "POLLING_ID_NOT_FOUND",
                  display: "The polling id was not found",
                  system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
                  version: "1"
                }
              ]
            }
          }
        ]
      }
      return {
        statusCode: 404,
        body: notFoundOperationOutcome
      }
    }
  }
}

export class LiveRequestHandler implements RequestHandler {
  private readonly spineEndpoint: string
  private readonly spinePath: string
  private readonly ebXMLBuilder: (spineRequest: SpineRequest) => string

  constructor(spineEndpoint: string, spinePath: string, ebXMLBuilder: (spineRequest: SpineRequest) => string) {
    this.spineEndpoint = spineEndpoint
    this.spinePath = spinePath
    this.ebXMLBuilder = ebXMLBuilder
  }

  async send(spineRequest: SpineRequest): Promise<SpineResponse<unknown>> {
    const wrappedMessage = this.ebXMLBuilder(spineRequest)
    const address = `${SPINE_URL_SCHEME}://${this.spineEndpoint}${this.spinePath}`

    console.log(`Attempting to send the following message to ${address}:\n${wrappedMessage}`)

    try {
      const result = await axios.post<string>(
        address,
        wrappedMessage,
        {
          httpsAgent,
          headers: {
            "Content-Type": 'multipart/related; boundary="--=_MIME-Boundary"; type=text/xml; start=ebXMLHeader@spine.nhs.uk',
            "SOAPAction": `urn:nhs:names:services:mm/${spineRequest.interactionId}`
          }
        }
      )
      return LiveRequestHandler.handlePollableOrImmediateResponse(result)
    } catch (error) {
      console.log(`Failed post request for prescription message. Error: ${error}`)
      return LiveRequestHandler.handleError(error)
    }
  }

  async poll(path: string): Promise<SpineResponse<unknown>> {
    const address = `${SPINE_URL_SCHEME}://${this.spineEndpoint}/_poll/${path}`

    console.log(`Attempting to send polling message to ${address}`)

    try {
      const result = await axios.get<string>(
        address,
        {
          httpsAgent,
          headers: {"nhsd-asid": process.env.FROM_ASID}
        }
      )
      return LiveRequestHandler.handlePollableOrImmediateResponse(result)
    } catch (error) {
      console.log(`Failed polling request for polling path ${path}. Error: ${error}`)
      return LiveRequestHandler.handleError(error)
    }
  }

  private static handlePollableOrImmediateResponse(result: AxiosResponse) {
    switch (result.status) {
    case (200):
      console.log("Successful request, returning SpineDirectResponse")
      return {
        body: result.data,
        statusCode: result.status
      }
    case (202):
      console.log("Successful request, returning SpinePollableResponse")
      console.log(`Got polling URL ${result.headers["content-location"]}`)
      return {
        statusCode: result.status,
        pollingUrl: result.headers["content-location"]
      }
    default:
      console.log(`Got the following response from spine:\n${result.data}`)
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
    } else if (axiosError.request) {
      return {
        body: axiosError.request.data,
        statusCode: 408
      }
    } else {
      return {
        body: axiosError.message,
        statusCode: 500
      }
    }
  }
}

export const defaultRequestHandler = process.env.SANDBOX === "1" ? new SandboxRequestHandler() : new LiveRequestHandler(SPINE_ENDPOINT, SPINE_PATH, addEbXmlWrapper)
