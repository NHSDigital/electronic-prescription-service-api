import axios, {AxiosResponse} from "axios"
import https from "https"
import {addEbXmlWrapper} from "./request-builder"

const SPINE_ENDPOINT = process.env.SPINE_ENV === "INT" ? process.env.INT_SPINE_URL : process.env.TEST_SPINE_URL
const SPINE_PATH = "/Prescription"
const SPINE_URL_SCHEME = "https"

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

export class RequestHandler {
  private readonly spineEndpoint: string
  private readonly spinePath: string
  private readonly ebXMLBuilder: (message: string) => string

  constructor(spineEndpoint: string, spinePath: string, ebXMLBuilder: (message: string) => string) {
    this.spineEndpoint = spineEndpoint
    this.spinePath = spinePath
    this.ebXMLBuilder = ebXMLBuilder
  }

  async request(message: string): Promise<SpineResponse> {
    const wrappedMessage = this.ebXMLBuilder(message)
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
            "SOAPAction": "urn:nhs:names:services:mm/PORX_IN020101SM31"
          }
        }
      )
      return RequestHandler.handlePollableOrImmediateResponse(result)
    } catch (error) {
      console.log(`Failed post request for prescription message. Error: ${error}`)
      return RequestHandler.handleError(error)
    }
  }

  async poll(path: string): Promise<SpineResponse> {
    if (process.env.SANDBOX === "1") {
      console.log("Sandbox Mode. Returning fixed polling response")
      return {
        statusCode: 200,
        body: "Message Sent"
      }
    }

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
      return RequestHandler.handlePollableOrImmediateResponse(result)
    } catch (error) {
      console.log(`Failed polling request for polling path ${path}. Error: ${error}`)
      return RequestHandler.handleError(error)
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

  async sendData(message: string): Promise<SpineResponse> {
    return (
      process.env.SANDBOX === "1" ?
        Promise.resolve({
          pollingUrl: '_poll/9807d292_074a_49e8_b48d_52e5bbf785ed',
          statusCode: 202
        }) :
        await this.request(message)
    )
  }
}

export const defaultRequestHandler = new RequestHandler(SPINE_ENDPOINT, SPINE_PATH, addEbXmlWrapper)
