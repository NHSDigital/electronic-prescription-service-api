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
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  RawAxiosRequestHeaders
} from "axios"
import {CONFIG} from "../../config"
import * as Hapi from "@hapi/hapi"
import {getSessionValue} from "../session"
import {Ping} from "../../routes/health/get-status"
import {DosageTranslationArray} from "../../routes/dose-to-text"

type QueryParams = Record<string, string | Array<string>>

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

interface ApiCall {
  path: string,
  api: string,
  body?: unknown,
  params?: URLSearchParams,
  requestId?: string,
  correlationId? : string,
  additionalHeaders?: RawAxiosRequestHeaders
}

interface GetEpsResponse {
  endpoint: string,
  api: string,
  body?: FhirResource,
  params?: URLSearchParams,
  fhirResponseOnly?: boolean,
  correlationId: string
}

class EpsClient {
  private request: Hapi.Request
  private axiosInstance: AxiosInstance

  constructor(request: Hapi.Request) {
    this.request = request
    this.axiosInstance = axios.create()
    const logger = request.logger

    this.axiosInstance.interceptors.request.use((request: InternalAxiosRequestConfig) => {
      logger.info({
        apiCall: {
          request: {
            headers: request.headers,
            url: request.url,
            baseURL: request.baseURL,
            method: request.method
          }}
      }, "making api call")

      return request
    })

    this.axiosInstance.interceptors.response.use((response: AxiosResponse) => {
      logger.info({
        apiCall: {
          response: {
            headers: response.headers,
            status: response.status
          }
        }
      }, "successful api call")

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

  }

  async makeGetTaskTrackerRequest(query: QueryParams, correlationId: string): Promise<Bundle | OperationOutcome> {
    const urlSearchParams = getUrlSearchParams(query)
    return (await this.makeApiCall<Bundle | OperationOutcome>({
      path: "Task",
      api: "prescribe",
      params: urlSearchParams,
      correlationId
    })).data
  }

  async makePrepareRequest(body: Bundle, correlationId: string): Promise<Parameters | OperationOutcome> {
    return (await this.makeApiCall<Parameters | OperationOutcome>({
      path: "$prepare",
      api: "prescribe",
      body,
      correlationId
    })).data
  }

  async makeSendRequest(body: Bundle, correlationId: string): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse({
      endpoint: "$process-message",
      api: "prescribe",
      body,
      correlationId
    })
  }

  async makeSendFhirRequest(body: Bundle, correlationId: string): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse({
      endpoint: "$process-message",
      api: "prescribe",
      body,
      correlationId,
      fhirResponseOnly: true
    })
  }

  async makeReleaseRequest(
    body: Parameters, correlationId: string): Promise<EpsResponse<Parameters | OperationOutcome>> {
    return await this.getEpsResponse({
      endpoint: "Task/$release",
      api: "dispense",
      body,
      correlationId
    })
  }

  async makeReturnRequest(body: Task, correlationId: string): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse({
      endpoint: "Task",
      api: "dispense",
      body,
      correlationId
    })
  }

  async makeWithdrawRequest(body: Task, correlationId: string): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse({
      endpoint: "Task",
      api: "dispense",
      body,
      correlationId
    })
  }

  async makeClaimRequest(body: Claim, correlationId: string): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse({
      endpoint: "Claim",
      api: "dispense",
      body: body,
      correlationId
    })
  }

  async makePingRequest(): Promise<Ping> {
    const basePath = this.getBasePath("prescribe")
    const url = `${CONFIG.apigeeEgressHost}/${basePath}/_ping`
    return (await this.axiosInstance.get<Ping>(url)).data
  }

  async makeValidateRequest(body: FhirResource, correlationId: string): Promise<EpsResponse<OperationOutcome>> {
    const response = await this.makeApiCall<OperationOutcome>({
      path: "$validate",
      api: "prescribe",
      body,
      correlationId,
      additionalHeaders: {"x-show-validation-warnings": "true"}
    })
    const statusCode = response.status
    const fhirResponse = response.data
    return {statusCode, fhirResponse}
  }

  async makeConvertRequest(body: FhirResource, correlationId: string): Promise<string> {
    const response = (await this.makeApiCall<string | OperationOutcome>({
      path: "$convert",
      api: "prescribe",
      body,
      correlationId
    })).data
    return typeof response === "string" ? response : JSON.stringify(response, null, 2)
  }

  async makeDoseToTextRequest(body: FhirResource, correlationId: string): Promise<EpsResponse<DosageTranslationArray>> {
    const requestId = uuid.v4()
    const response = await this.makeApiCall<DosageTranslationArray>({
      path: "$dose-to-text",
      api: "prescribe",
      body,
      requestId,
      correlationId
    })
    const statusCode = response.status
    const doseToTextResponse = response.data
    return {statusCode, fhirResponse: doseToTextResponse}
  }

  private async getEpsResponse<T>(
    params: GetEpsResponse
  ) {
    const requestId = uuid.v4()
    const response = await this.makeApiCall<T>({
      path: params.endpoint,
      api: params.api,
      body: params.body,
      params: params.params,
      requestId,
      correlationId: params.correlationId
    })
    const statusCode = response.status
    const fhirResponse = response.data
    const spineResponse = params.fhirResponseOnly
      ? ""

      : (await this.makeApiCall<string | OperationOutcome>({
        path: params.endpoint,
        api: params.api,
        body: params.body,
        params: params.params,
        requestId,
        correlationId: params.correlationId,
        additionalHeaders: {"x-raw-response": "true"}
      })).data
    return {statusCode, fhirResponse, spineResponse: this.asString(spineResponse)}
  }

  private async makeApiCall<T>(
    apiCall: ApiCall
  ): Promise<AxiosResponse<T>> {
    const basePath = this.getBasePath(apiCall.api)
    const url = `${CONFIG.apigeeEgressHost}/${basePath}/FHIR/R4/${apiCall.path}`
    const headers: RawAxiosRequestHeaders = this.getHeaders(apiCall.requestId, apiCall.correlationId)
    if (apiCall.additionalHeaders) {
      Object.assign(headers, apiCall.additionalHeaders)
    }

    return this.axiosInstance.request({
      url,
      method: apiCall.body ? "POST" : "GET",
      headers,
      data: apiCall.body,
      params: apiCall.params
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

  protected getHeaders(requestId: string | undefined, correlationId: string | undefined): RawAxiosRequestHeaders {
    return {
      "x-request-id": requestId ?? uuid.v4(),
      "x-correlation-id": correlationId ?? uuid.v4()
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

  protected override getHeaders(
    requestId: string | undefined,
    correlationId: string | undefined
  ): RawAxiosRequestHeaders {
    return {
      "Authorization": `Bearer ${this.accessToken}`,
      "x-request-id": requestId ?? uuid.v4(),
      "x-correlation-id": correlationId ?? uuid.v4()
    }
  }
}

export function getEpsClient(accessToken: string, request: Hapi.Request): EpsClient {
  return isLocal(CONFIG.environment)
    ? new SandboxEpsClient(request)
    : new LiveEpsClient(accessToken, request)
}
