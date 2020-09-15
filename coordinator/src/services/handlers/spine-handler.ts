import axios, {AxiosResponse} from "axios"
import https from "https"
import {Handler} from "."
import {SpineResponse} from "../../models/spine/responses"
import {addEbXmlWrapper} from "../formatters/ebxml-request-builder"

const SPINE_URL_SCHEME = "https"
const SPINE_ENDPOINT = process.env.SPINE_ENV === "INT" ? process.env.INT_SPINE_URL : process.env.TEST_SPINE_URL
const SPINE_PATH = "/Prescription"

const httpsAgent = new https.Agent({
  cert: process.env.CLIENT_CERT,
  key: process.env.CLIENT_KEY,
  ca: [
    process.env.ROOT_CA_CERT,
    process.env.SUB_CA_CERT
  ]
})

export class SpineHandler implements Handler {
  private readonly spineEndpoint: string
  private readonly spinePath: string
  private readonly ebXMLBuilder: (message: string) => string

  constructor(spineEndpoint: string = null, spinePath: string = null, ebXMLBuilder: (message: string) => string = null) {
    this.spineEndpoint = spineEndpoint || SPINE_ENDPOINT
    this.spinePath = spinePath || SPINE_PATH
    this.ebXMLBuilder = ebXMLBuilder || addEbXmlWrapper
  }

  async send(message: string): Promise<SpineResponse> {
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
      return SpineHandler.handlePollableOrImmediateResponse(result)
    } catch (error) {
      console.log(`Failed post request for prescription message. Error: ${error}`)
      return SpineHandler.handleError(error)
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
      return SpineHandler.handlePollableOrImmediateResponse(result)
    } catch (error) {
      console.log(`Failed polling request for polling path ${path}. Error: ${error}`)
      return SpineHandler.handleError(error)
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
