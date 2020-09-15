import axios, {AxiosResponse} from "axios"
import https from "https"
import {addEbXmlWrapper} from "./request-builder"
import {Hl7InteractionIdentifier} from "../model/hl7-v3-datatypes-codes"

const SPINE_ENDPOINT = process.env.SPINE_ENV === "INT" ? process.env.INT_SPINE_URL : process.env.TEST_SPINE_URL
const SPINE_PATH = "/Prescription"
const SPINE_URL_SCHEME = "https"

export interface SpineRequest {
  message: string
  interactionId: string
}

type SpineResponse = SpineDirectResponse | SpinePollableResponse

export interface SpineDirectResponse {
  body: string
  statusCode: number
}

export interface SpinePollableResponse {
  pollingUrl: string
  statusCode: number
}

export function isDirect(spineResponse: SpineResponse): spineResponse is SpineDirectResponse {
  return !isPollable(spineResponse)
}

export function isPollable(spineResponse: SpineResponse): spineResponse is SpinePollableResponse {
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
  send(spineRequest: SpineRequest): Promise<SpineResponse>
  poll(path: string): Promise<SpineResponse>
}

export class SandboxRequestHandler implements RequestHandler {
  parentPrescriptionPollingId = "9807d292_074a_49e8_b48d_52e5bbf785ed"
  cancellationPollingId = "a549d4d6_e6aa_4664_95f8_6c0cac17bd77"

  async send(spineRequest: SpineRequest): Promise<SpineResponse> {
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

  async poll(path: string): Promise<SpineResponse> {
    if (path === this.parentPrescriptionPollingId) {
      //TODO - add realistic response
      return {
        statusCode: 200,
        body: "Prescription message sent"
      }
    } else if (path === this.cancellationPollingId) {
      //TODO - add realistic response
      return {
        statusCode: 200,
        body: "Cancellation message sent"
      }
    } else {
      //TODO - add realistic response
      return {
        statusCode: 404,
        body: "Polling ID not found"
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

  async send(spineRequest: SpineRequest): Promise<SpineResponse> {
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

  async poll(path: string): Promise<SpineResponse> {
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

  private static handleError(error: Error): SpineResponse {
    /* eslint-disable */
    const anyError = error as any

    if (anyError.response) {
      return {
        body: anyError.response.data,
        statusCode: anyError.response.status
      }
    } else if (anyError.request) {
      return {
        body: anyError.request.data,
        statusCode: 408
      }
    } else {
      return {
        body: anyError.message,
        statusCode: 500
      }
    }
  }
}

export const defaultRequestHandler = process.env.SANDBOX === "1" ? new SandboxRequestHandler() : new LiveRequestHandler(SPINE_ENDPOINT, SPINE_PATH, addEbXmlWrapper)
