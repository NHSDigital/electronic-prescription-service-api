import * as uuid from "uuid"
import axios, {AxiosRequestHeaders, AxiosResponse} from "axios"
import {Bundle, OperationOutcome, Parameters} from "fhir/r4"
import {EpsClient, EpsSearchRequest, EpsSendReponse} from "./eps-client"

export class LiveEpsClient implements EpsClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async makeGetTrackerRequest(searchRequest: EpsSearchRequest): Promise<Bundle | OperationOutcome> {
    return await (await this.makeApiCall<Bundle | OperationOutcome>(`Task?focus:identifier=${searchRequest.prescriptionId}`)).data
  }

  async makePrepareRequest(body: Bundle): Promise<Parameters> {
    return await (await this.makeApiCall<Parameters>("$prepare", body)).data
  }

  async makeSendRequest(body: Bundle): Promise<EpsSendReponse> {
    const requestId = uuid.v4()
    const rawResponseHeaders = {
      "x-raw-response": "true"
    }
    const response = await this.makeApiCall<OperationOutcome>("$process-message", body, requestId)
    const statusCode = response.status
    const fhirResponse = await response.data
    const spineResponse = await (await this.makeApiCall<string>("$process-message", body, requestId, rawResponseHeaders)).data
    return {statusCode, fhirResponse, spineResponse}
  }

  async makeConvertRequest(body: unknown): Promise<string> {
    return await (await this.makeApiCall<string>("$convert", body)).data
  }

  private async makeApiCall<T>(
    path: string,
    body?: unknown,
    requestId?: string,
    additionalHeaders?: AxiosRequestHeaders
  ): Promise<AxiosResponse<T>> {
    const url = `https://${process.env.APIGEE_DOMAIN_NAME}/electronic-prescriptions/FHIR/R4/${path}`
    let headers: AxiosRequestHeaders = {
      "Authorization": `Bearer ${this.accessToken}`,
      "x-request-id": requestId ?? uuid.v4(),
      "x-correlation-id": uuid.v4()
    }
    if (additionalHeaders) {
      headers = {
        ...headers,
        ...additionalHeaders
      }
    }
    if (body) {
      return await axios.post(url, body, {headers: headers})
    }

    return await axios.get(url, {headers: headers})
  }
}
