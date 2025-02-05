import * as uuid from "uuid"
import {
  Bundle,
  Claim,
  FhirResource,
  OperationOutcome,
  Parameters,
  Task
} from "fhir/r4"
import {isLocal} from "../environment"
import {URLSearchParams} from "url"
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
  RawAxiosRequestHeaders
} from "axios"
import {CONFIG} from "../../config"
import * as Hapi from "@hapi/hapi"
import {getSessionValue} from "../session"
import {Ping} from "../../routes/health/get-status"
import {DosageTranslationArray} from "../../routes/dose-to-text"
import pino from "pino"

const logger = pino()

type QueryParams = Record<string, string | Array<string>>

const axiosInstance = axios.create()

axiosInstance.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  logger.info({
    request: {
      headers: request.headers,
      url: request.url,
      baseURL: request.baseURL,
      method: request.method
    }}, "making api call")

  return request
})

axiosInstance.interceptors.response.use((response: AxiosResponse) => {
  logger.info({
    response: {
      headers: response.headers,
      status: response.status
    }}, "successful api call")

  return response
}, (error: AxiosError) => {
  logger.error({
    response: {
      headers: error.response?.headers,
      status: error.response?.status
    }}, "unsuccessful api call")

  // let epsat figure out how to deal with errors so just return response
  return error.response
})

const getUrlSearchParams = (query: QueryParams): URLSearchParams => {
  const urlSearchParams = new URLSearchParams()
  Object.keys(query).forEach(key => {
    const valueOrValues = query[key]
    if (typeof valueOrValues === "string") {
      urlSearchParams.append(key, valueOrValues)
    } else {
      valueOrValues.forEach(value => urlSearchParams.append(key, value))
    }
  })
  return urlSearchParams
}

interface EpsResponse<T> {
  statusCode: number,
  fhirResponse: T
  spineResponse?: string
}

class EpsClient {
  private request: Hapi.Request

  constructor(request: Hapi.Request) {
    this.request = request
  }

  async makeGetTaskTrackerRequest(query: QueryParams): Promise<Bundle | OperationOutcome> {
    const urlSearchParams = getUrlSearchParams(query)
    return (await this.makeApiCall<Bundle | OperationOutcome>("Task", "prescribe", undefined, urlSearchParams)).data
  }

  async makePrepareRequest(body: Bundle): Promise<Parameters | OperationOutcome> {
    return (await this.makeApiCall<Parameters | OperationOutcome>("$prepare", "prescribe", body)).data
  }

  async makeSendRequest(body: Bundle): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse("$process-message", "prescribe", body)
  }

  async makeSendFhirRequest(body: Bundle): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse("$process-message", "prescribe", body, undefined, true)
  }

  async makeReleaseRequest(body: Parameters): Promise<EpsResponse<Parameters | OperationOutcome>> {
    return await this.getEpsResponse("Task/$release", "dispense", body)
  }

  async makeReturnRequest(body: Task): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse("Task", "dispense", body)
  }

  async makeWithdrawRequest(body: Task): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse("Task", "dispense", body)
  }

  async makeClaimRequest(body: Claim): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse("Claim", "dispense", body)
  }

  async makePingRequest(): Promise<Ping> {
    const basePath = this.getBasePath("prescribe")
    const url = `${CONFIG.apigeeEgressHost}/${basePath}/_ping`
    return (await axiosInstance.get<Ping>(url)).data
  }

  async makeValidateRequest(body: FhirResource): Promise<EpsResponse<OperationOutcome>> {
    const requestId = uuid.v4()
    // eslint-disable-next-line max-len
    const response = await this.makeApiCall<OperationOutcome>("$validate", "prescribe", body, undefined, requestId, {"x-show-validation-warnings": "true"})
    const statusCode = response.status
    const fhirResponse = response.data
    return {statusCode, fhirResponse}
  }

  async makeConvertRequest(body: FhirResource): Promise<string> {
    const response = (await this.makeApiCall<string | OperationOutcome>("$convert", "prescribe", body)).data
    return typeof response === "string" ? response : JSON.stringify(response, null, 2)
  }

  async makeDoseToTextRequest(body: FhirResource): Promise<EpsResponse<DosageTranslationArray>> {
    const requestId = uuid.v4()
    const response = await this.makeApiCall<DosageTranslationArray>(
      "$dose-to-text", "prescribe", body, undefined, requestId)
    const statusCode = response.status
    const doseToTextResponse = response.data
    return {statusCode, fhirResponse: doseToTextResponse}
  }

  private async getEpsResponse<T>(
    endpoint: string,
    api: string,
    body?: FhirResource,
    params?: URLSearchParams,
    fhirResponseOnly?: boolean
  ) {
    const requestId = uuid.v4()
    const response = await this.makeApiCall<T>(endpoint, api, body, params, requestId)
    const statusCode = response.status
    const fhirResponse = response.data
    const spineResponse = fhirResponseOnly
      ? ""
      // eslint-disable-next-line max-len
      : (await this.makeApiCall<string | OperationOutcome>(endpoint, api, body, params, requestId, {"x-raw-response": "true"})).data
    return {statusCode, fhirResponse, spineResponse: this.asString(spineResponse)}
  }

  private async makeApiCall<T>(
    path: string,
    api: string,
    body?: unknown,
    params?: URLSearchParams,
    requestId?: string,
    additionalHeaders?: RawAxiosRequestHeaders
  ): Promise<AxiosResponse<T>> {
    const basePath = this.getBasePath(api)
    const url = `${CONFIG.apigeeEgressHost}/${basePath}/FHIR/R4/${path}`
    const headers: RawAxiosRequestHeaders = this.getHeaders(requestId)
    if (additionalHeaders) {
      Object.assign(headers, additionalHeaders)
    }

    return axiosInstance.request({
      url,
      method: body ? "POST" : "GET",
      headers,
      data: body,
      params
    })
  }

  protected getBasePath(api: string): string {
    const prNumber = getSessionValue("eps_pr_number", this.request)
    const useProxygen = getSessionValue("use_proxygen", this.request)
    let replacementString = "electronic-prescriptions"
    if (useProxygen) {
      replacementString = api==="prescribe" ? "fhir-prescribing" : "fhir-dispensing"
    }
    return prNumber
      ? `${replacementString}-pr-${prNumber}`
      : `${CONFIG.basePath}`.replace("eps-api-tool", replacementString)
  }

  protected getHeaders(requestId: string | undefined): RawAxiosRequestHeaders {
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
  constructor(request: Hapi.Request) {
    super(request)
  }

  override makePingRequest(): Promise<Ping> {
    return Promise.resolve({
      commitId: "",
      releaseId: "",
      revision: "",
      version: "internal-dev-sandbox"
    })
  }
}

class LiveEpsClient extends EpsClient {
  private accessToken: string

  constructor(accessToken: string, request: Hapi.Request) {
    super(request)
    this.accessToken = accessToken
  }

  protected override getHeaders(requestId: string | undefined): RawAxiosRequestHeaders {
    return {
      "Authorization": `Bearer ${this.accessToken}`,
      "x-request-id": requestId ?? uuid.v4(),
      "x-correlation-id": uuid.v4()
    }
  }
}

export function getEpsClient(accessToken: string, request: Hapi.Request): EpsClient {
  return isLocal(CONFIG.environment)
    ? new SandboxEpsClient(request)
    : new LiveEpsClient(accessToken, request)
}
