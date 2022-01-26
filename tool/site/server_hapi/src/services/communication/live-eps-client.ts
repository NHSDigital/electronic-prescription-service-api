import * as uuid from "uuid"
import axios, {AxiosRequestHeaders, AxiosResponse} from "axios"
import {Bundle, Claim, FhirResource, OperationOutcome, Parameters, Task} from "fhir/r4"
import {asString, EpsClient, EpsResponse} from "./eps-client"
import {URLSearchParams} from "url"

export class LiveEpsClient implements EpsClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async makeGetTrackerRequest(query: Record<string, string | Array<string>>): Promise<Bundle | OperationOutcome> {
    const urlSearchParams = new URLSearchParams()
    Object.keys(query).forEach(key => {
      const valueOrValues = query[key]
      if (typeof valueOrValues === "string") {
        urlSearchParams.append(key, valueOrValues)
      } else {
        valueOrValues.forEach(value => urlSearchParams.append(key, value))
      }
    })
    return (await this.makeApiCall<Bundle | OperationOutcome>("Task", undefined, urlSearchParams)).data
  }

  async makePrepareRequest(body: Bundle): Promise<Parameters | OperationOutcome> {
    return (await this.makeApiCall<Parameters | OperationOutcome>("$prepare", body)).data
  }

  async makeSendRequest(body: Bundle): Promise<EpsResponse<OperationOutcome>> {
    const requestId = uuid.v4()
    const rawResponseHeaders = {
      "x-raw-response": "true"
    }
    const response = await this.makeApiCall<OperationOutcome>("$process-message", body, undefined, requestId)
    const statusCode = response.status
    const fhirResponse = response.data
    const spineResponse = (await this.makeApiCall<string | OperationOutcome>("$process-message", body, undefined, requestId, rawResponseHeaders)).data
    return {statusCode, fhirResponse, spineResponse: asString(spineResponse)}
  }

  async makeReleaseRequest(body: Parameters): Promise<EpsResponse<Bundle | OperationOutcome>> {
    const requestId = uuid.v4()
    const rawResponseHeaders = {
      "x-raw-response": "true"
    }
    const response = await this.makeApiCall<Bundle | OperationOutcome>("Task/$release", body, undefined, requestId)
    const statusCode = response.status
    const fhirResponse = response.data
    const spineResponse = (await this.makeApiCall<string | OperationOutcome>("Task/$release", body, undefined, requestId, rawResponseHeaders)).data
    return {statusCode, fhirResponse, spineResponse: asString(spineResponse)}
  }

  async makeReturnRequest(body: Task): Promise<EpsResponse<OperationOutcome>> {
    const requestId = uuid.v4()
    const rawResponseHeaders = {
      "x-raw-response": "true"
    }
    const response = await this.makeApiCall<OperationOutcome>("Task", body, undefined, requestId)
    const statusCode = response.status
    const fhirResponse = response.data
    const spineResponse = (await this.makeApiCall<string | OperationOutcome>("Task", body, undefined, requestId, rawResponseHeaders)).data
    return {statusCode, fhirResponse, spineResponse: asString(spineResponse)}
  }

  async makeClaimRequest(body: Claim): Promise<EpsResponse<OperationOutcome>> {
    const requestId = uuid.v4()
    const rawResponseHeaders = {
      "x-raw-response": "true"
    }
    const response = await this.makeApiCall<OperationOutcome>("Claim", body, undefined, requestId)
    const statusCode = response.status
    const fhirResponse = response.data
    const spineResponse = (await this.makeApiCall<string | OperationOutcome>("Claim", body, undefined, requestId, rawResponseHeaders)).data
    return {statusCode, fhirResponse, spineResponse: asString(spineResponse)}
  }

  async makeValidateRequest(body: FhirResource): Promise<EpsResponse<OperationOutcome>> {
    const requestId = uuid.v4()
    const response = await this.makeApiCall<OperationOutcome>("$validate", body, undefined, requestId)
    const statusCode = response.status
    const fhirResponse = response.data
    return {statusCode, fhirResponse}
  }

  async makeConvertRequest(body: FhirResource): Promise<string> {
    const response = (await this.makeApiCall<string | OperationOutcome>("$convert", body)).data
    return typeof response === "string" ? response : JSON.stringify(response, null, 2)
  }

  async makeWithdrawRequest(body: Task): Promise<EpsResponse<OperationOutcome>> {
    const requestId = uuid.v4()
    const rawResponseHeaders = {
      "x-raw-response": "true"
    }
    const response = await this.makeApiCall<OperationOutcome>("Task", body, undefined, requestId)
    const statusCode = response.status
    const fhirResponse = response.data
    const spineResponse = (await this.makeApiCall<string | OperationOutcome>("Task", body, undefined, requestId, rawResponseHeaders)).data
    return {statusCode, fhirResponse, spineResponse: asString(spineResponse)}
  }

  private async makeApiCall<T>(
    path: string,
    body?: unknown,
    params?: URLSearchParams,
    requestId?: string,
    additionalHeaders?: AxiosRequestHeaders
  ): Promise<AxiosResponse<T>> {
    const basePath = `${process.env.BASE_PATH}`.replace("eps-api-tool", "electronic-prescriptions")
    const url = `https://${process.env.APIGEE_DOMAIN_NAME}/${basePath}/FHIR/R4/${path}`
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
      data: body,
      params
    })
  }
}
