import axios from "axios"
import https from "https"
import { addEbXmlWrapper } from "./request-builder"

const SPINE_ENDPOINT = 'https://veit07.devspineservices.nhs.uk'
const SPINE_PATH = '/Prescription'

type SpineResponse = SpineDirectResponse | SpinePollableResponse

export interface SpineDirectResponse {
    body: string
    statusCode: number
}

export interface SpinePollableResponse {
    pollingUrl: string
    statusCode: number
}

export function isPollable(spineResponse: SpineResponse): spineResponse is SpinePollableResponse {
    return 'pollingUrl' in spineResponse
}

const httpsAgent = new https.Agent({
    cert: process.env.CLIENT_CERT,
    key: process.env.CLIENT_KEY,
    ca: [
        process.env.ROOT_CA_CERT,
        process.env.SUB_CA_CERT
    ]
});

export class RequestHandler {

    private spineEndpoint: string
    private spinePath: string
    private ebXMLBuilder: (message: string) => string

    constructor(spineEndpoint: string, spinePath: string, ebXMLBuilder: (message: string) => string) {
        this.spineEndpoint = spineEndpoint
        this.spinePath = spinePath
        this.ebXMLBuilder = ebXMLBuilder
    }   

    async request(message: string): Promise<SpineResponse> {
        const wrappedMessage = this.ebXMLBuilder(message)

        console.log(`Attempting to send the following message to spine:\n${wrappedMessage}`)

        try {
            const result = await axios.post<string>(
                `${this.spineEndpoint}${this.spinePath}`,
                wrappedMessage,
                {
                    httpsAgent,
                    headers: {
                        "Content-Type": "multipart/related; boundary=\"--=_MIME-Boundary\"; type=text/xml; start=ebXMLHeader@spine.nhs.uk",
                        "SOAPAction": "urn:nhs:names:services:mm/PORX_IN020101SM31"
                    }
                }
            )

            switch (result.status) {
                case (202): {
                    console.log('Successful post request for prescription message')
                    const pollingUrl = result.headers['content-location']
                    console.log(`Got polling URL ${pollingUrl}`)

                    return {
                        statusCode: result.status,
                        pollingUrl: pollingUrl
                    }
                }
                default: {
                    throw Error(`Unsupported status, expected 202, got ${result.status}`)
                }
            }
        } catch (error) {
            console.error(`Failed post request for prescription message. Error: ${error}`)
            return this.handleError(error)
        }
    }

    async poll(path: string): Promise<SpineResponse> {
        if (process.env.SANDBOX === "1") {
            console.log('Sandbox Mode. Returning fixed polling response')
            return {
                statusCode: 200,
                body: 'Message Sent'
            }
        }

        try {
            const result = await axios.get<string>(
                `${this.spineEndpoint}/_poll/${path}`,
                {
                    httpsAgent,
                    headers: { "nhsd-asid": process.env.FROM_ASID }
                }
            )
    
            switch (result.status) {
                case (200): {
                    console.log('Successful request for polling message')
                    return {
                        body: result.data,
                        statusCode: result.status
                    }
                }
                case (202): {
                    console.log('Successful request for polling message')
                    const pollingUrl = result.headers['content-location']
                    console.log(`Got polling URL ${pollingUrl}`)
            
                    return {
                        statusCode: result.status,
                        pollingUrl: pollingUrl
                    }
                }
                default: {
                    throw Error(`Unsupported status, expected 200 or 202, got ${result.status}`)
                }
            }
        } catch (error) {
            console.error(`Failed polling request for polling path ${path}. Error: ${error}`)
            return this.handleError(error)
        }
    }

    private handleError(error: Error): SpineResponse {

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
