import * as uuid from "uuid"
import {Bundle, Claim, FhirResource, OperationOutcome, Parameters, Task} from "fhir/r4"
import {isLocal} from "../environment"
import {URLSearchParams} from "url"
import axios, {AxiosRequestHeaders, AxiosResponse} from "axios"
import {CONFIG} from "../../config"

interface EpsResponse<T> {
  statusCode: number,
  fhirResponse: T
  spineResponse?: string
}

export class EpsClient {
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
    return await this.getEpsResponse("$process-message", body)
  }

  async makeReleaseRequest(body: Parameters): Promise<EpsResponse<Bundle | OperationOutcome>> {
    return await this.getEpsResponse("Task/$release", body)
  }

  async makeReturnRequest(body: Task): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse("Task", body)
  }

  async makeWithdrawRequest(body: Task): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse("Task", body)
  }

  async makeClaimRequest(body: Claim): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse("Claim", body)
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

  private async getEpsResponse<T>(endpoint: string, body: FhirResource) {
    const requestId = uuid.v4()
    const response = await this.makeApiCall<T>(endpoint, body, undefined, requestId)
    const statusCode = response.status
    const fhirResponse = response.data
    const spineResponse = (await this.makeApiCall<string | OperationOutcome>(endpoint, body, undefined, requestId, {"x-raw-response": "true"})).data
    return {statusCode, fhirResponse, spineResponse: this.asString(spineResponse)}
  }

  private async makeApiCall<T>(
    path: string,
    body?: unknown,
    params?: URLSearchParams,
    requestId?: string,
    additionalHeaders?: AxiosRequestHeaders
  ): Promise<AxiosResponse<T>> {
    const basePath = `${CONFIG.basePath}`.replace("eps-api-tool", "electronic-prescriptions")
    const url = `${CONFIG.privateApigeeUrl}/${basePath}/FHIR/R4/${path}`
    const headers: AxiosRequestHeaders = this.getHeaders(requestId)
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

  protected getHeaders(requestId: string | undefined): AxiosRequestHeaders {
    return {
      "x-request-id": requestId ?? uuid.v4(),
      "x-correlation-id": uuid.v4()
    }
  }

  private asString(response: string | OperationOutcome): string {
    return typeof response === "string" ? response : JSON.stringify(response, null, 2)
  }
}

// Note derived classes cannot be in separate files due to circular reference issues with typescript
// See these GitHub issues: https://github.com/Microsoft/TypeScript/issues/20361, #4149, #10712
class SandboxEpsClient extends EpsClient {
  constructor() {
    super()
  }
}

class LiveEpsClient extends EpsClient {
  private accessToken: string

  constructor(accessToken: string) {
    super()
    this.accessToken = accessToken
  }

  protected override getHeaders(requestId: string | undefined): AxiosRequestHeaders {
    return {
      "Authorization": `Bearer ${this.accessToken}`,
      "x-request-id": requestId ?? uuid.v4(),
      "x-correlation-id": uuid.v4()
    }
  }
}

export function getEpsClient(accessToken: string): EpsClient {
  return isLocal()
    ? new SandboxEpsClient()
    : new LiveEpsClient(accessToken)
}
