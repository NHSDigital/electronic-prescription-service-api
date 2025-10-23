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

enum ApiType {
  Prescribing = "fhir-prescribing",
  Dispensing = "fhir-dispensing"
}

interface ApiCallParameters {
  path: string,
  apiType: ApiType,
  body?: unknown,
  params?: URLSearchParams,
  requestId?: string,
  correlationId : string,
  additionalHeaders?: RawAxiosRequestHeaders
}

interface GetEpsResponseParameters {
  endpoint: string,
  apiType: ApiType,
  body?: FhirResource,
  params?: URLSearchParams,
  fhirResponseOnly?: boolean,
  correlationId: string
}

class EpsClient {
  private request: Hapi.Request
  private readonly axiosInstance: AxiosInstance

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
      apiType: ApiType.Dispensing,
      params: urlSearchParams,
      correlationId
    })).data
  }

  async makePrepareRequest(
    body: Bundle,
    correlationId: string,
    selectedRole: string | undefined
  ): Promise<Parameters | OperationOutcome> {
    return (await this.makeApiCall<Parameters | OperationOutcome>({
      path: "$prepare",
      apiType: ApiType.Prescribing,
      body,
      correlationId,
      additionalHeaders: selectedRole ? {"NHSD-Session-URID": selectedRole} : undefined
    })).data
  }

  async makeSendRequest(body: Bundle, correlationId: string): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse({
      endpoint: "$process-message",
      apiType: ApiType.Prescribing,
      body,
      correlationId
    })
  }

  async makeDispenseRequest(body: Bundle, correlationId: string): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse({
      endpoint: "$process-message",
      apiType: ApiType.Dispensing,
      body,
      correlationId
    })
  }

  async makeSendFhirRequest(body: Bundle, correlationId: string): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse({
      endpoint: "$process-message",
      apiType: ApiType.Prescribing,
      body,
      correlationId,
      fhirResponseOnly: true
    })
  }

  async makeReleaseRequest(
    body: Parameters, correlationId: string): Promise<EpsResponse<Parameters | OperationOutcome>> {
    return await this.getEpsResponse({
      endpoint: "Task/$release",
      apiType: ApiType.Dispensing,
      body,
      correlationId
    })
  }

  async makeReturnRequest(body: Task, correlationId: string): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse({
      endpoint: "Task",
      apiType: ApiType.Dispensing,
      body,
      correlationId
    })
  }

  async makeWithdrawRequest(body: Task, correlationId: string): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse({
      endpoint: "Task",
      apiType: ApiType.Dispensing,
      body,
      correlationId
    })
  }

  async makeClaimRequest(body: Claim, correlationId: string): Promise<EpsResponse<OperationOutcome>> {
    return await this.getEpsResponse({
      endpoint: "Claim",
      apiType: ApiType.Dispensing,
      body: body,
      correlationId
    })
  }

  async makePingRequest(): Promise<Ping> {
    const basePath = this.getBasePath(ApiType.Prescribing)
    const url = `${CONFIG.apigeeEgressHost}/${basePath}/_ping`
    return (await this.axiosInstance.get<Ping>(url)).data
  }

  async makeValidateRequest(body: FhirResource, correlationId: string): Promise<EpsResponse<OperationOutcome>> {
    const response = await this.makeApiCall<OperationOutcome>({
      path: "$validate",
      apiType: ApiType.Prescribing,
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
      apiType: ApiType.Prescribing,
      body,
      correlationId
    })).data
    return typeof response === "string" ? response : JSON.stringify(response, null, 2)
  }

  async makeDoseToTextRequest(body: FhirResource, correlationId: string): Promise<EpsResponse<DosageTranslationArray>> {
    const requestId = crypto.randomUUID()
    const response = await this.makeApiCall<DosageTranslationArray>({
      path: "$dose-to-text",
      apiType: ApiType.Prescribing,
      body,
      requestId,
      correlationId
    })
    const statusCode = response.status
    const doseToTextResponse = response.data
    return {statusCode, fhirResponse: doseToTextResponse}
  }

  private async getEpsResponse<T>(
    requestParameters: GetEpsResponseParameters
  ) {
    const requestId = crypto.randomUUID()
    const response = await this.makeApiCall<T>({
      path: requestParameters.endpoint,
      apiType: requestParameters.apiType,
      body: requestParameters.body,
      params: requestParameters.params,
      requestId,
      correlationId: requestParameters.correlationId
    })
    const statusCode = response.status
    const fhirResponse = response.data
    const spineResponse = requestParameters.fhirResponseOnly
      ? ""

      : (await this.makeApiCall<string | OperationOutcome>({
        path: requestParameters.endpoint,
        apiType: requestParameters.apiType,
        body: requestParameters.body,
        params: requestParameters.params,
        requestId,
        correlationId: requestParameters.correlationId,
        additionalHeaders: {"x-raw-response": "true"}
      })).data
    return {statusCode, fhirResponse, spineResponse: this.asString(spineResponse)}
  }

  private async makeApiCall<T>(
    apiCall: ApiCallParameters
  ): Promise<AxiosResponse<T>> {
    const basePath = this.getBasePath(apiCall.apiType)
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

  protected getBasePath(apiType: ApiType): string {
    const prNumber = getSessionValue("eps_pr_number", this.request)
    const useProxygen = getSessionValue("use_proxygen", this.request)
    const replacementString = useProxygen ? apiType : "electronic-prescriptions"
    return prNumber
      ? `${replacementString}-pr-${prNumber}`
      : `${CONFIG.basePath}`.replace("eps-api-tool", replacementString)
  }

  protected getHeaders(requestId: string | undefined, correlationId: string | undefined): RawAxiosRequestHeaders {
    return {
      "x-request-id": requestId ?? crypto.randomUUID(),
      "x-correlation-id": correlationId ?? crypto.randomUUID()
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
      "x-request-id": requestId ?? crypto.randomUUID(),
      "x-correlation-id": correlationId ?? crypto.randomUUID()
    }
  }
}

export function getEpsClient(accessToken: string, request: Hapi.Request): EpsClient {
  return isLocal(CONFIG.environment)
    ? new SandboxEpsClient(request)
    : new LiveEpsClient(accessToken, request)
}
