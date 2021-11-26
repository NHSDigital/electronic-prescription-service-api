import * as uuid from "uuid"
import axios, {AxiosRequestHeaders, AxiosResponse} from "axios"
import {Bundle, FhirResource, OperationOutcome, Parameters} from "fhir/r4"
import {EpsClient, EpsResponse} from "./eps-client"
import {URLSearchParams} from "url"

export class LiveEpsClient implements EpsClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async makeGetTrackerRequest(query: Record<string, string>): Promise<Bundle | OperationOutcome> {
    const queryStr = new URLSearchParams(query).toString()
    return await (await this.makeApiCall<Bundle | OperationOutcome>(`Task?${queryStr}`)).data
  }

  async makePrepareRequest(body: Bundle): Promise<Parameters | OperationOutcome> {
    return (await this.makeApiCall<Parameters | OperationOutcome>("$prepare", body)).data
  }

  async makeSendRequest(body: Bundle): Promise<EpsResponse<OperationOutcome>> {
    const requestId = uuid.v4()
    const rawResponseHeaders = {
      "x-raw-response": "true"
    }
    const response = await this.makeApiCall<OperationOutcome>("$process-message", body, requestId)
    const statusCode = response.status
    const fhirResponse = response.data
    const spineResponse = (await this.makeApiCall<string | OperationOutcome>("$process-message", body, requestId, rawResponseHeaders)).data
    return {statusCode, fhirResponse, spineResponse}
  }

  async makeReleaseRequest(body: Parameters): Promise<EpsResponse<Bundle | OperationOutcome>> {
    const requestId = uuid.v4()
    const rawResponseHeaders = {
      "x-raw-response": "true"
    }
    const response = await this.makeApiCall<Bundle | OperationOutcome>("Task/$release", body, requestId)
    const statusCode = response.status
    const fhirResponse = response.data
    const spineResponse = (await this.makeApiCall<string | OperationOutcome>("Task/$release", body, requestId, rawResponseHeaders)).data
    return {statusCode, fhirResponse, spineResponse}
  }

  async makeConvertRequest(body: FhirResource): Promise<string | OperationOutcome> {
    return (await this.makeApiCall<string>("$convert", body)).data
  }

  private async makeApiCall<T>(
    path: string,
    body?: unknown,
    requestId?: string,
    additionalHeaders?: AxiosRequestHeaders
  ): Promise<AxiosResponse<T>> {
    const url = `https://${process.env.APIGEE_DOMAIN_NAME}/electronic-prescriptions/FHIR/R4/${path}`
    const headers: AxiosRequestHeaders = {
      "Authorization": `Bearer ${this.accessToken}`,
      "x-request-id": requestId ?? uuid.v4(),
      "x-correlation-id": uuid.v4()
    }
    if (additionalHeaders) {
      Object.assign(headers, additionalHeaders)
    }

    return axios.request({
      url,
      method: body ? "POST" : "GET",
      headers,
      data: body
    })
  }
}
