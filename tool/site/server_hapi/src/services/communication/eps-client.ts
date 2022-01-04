import {SandboxEpsClient} from "./sandbox-eps-client"
import {LiveEpsClient} from "./live-eps-client"
import {Bundle, Claim, FhirResource, Parameters} from "fhir/r4"
import {isLocal} from "../environment"
import {OperationOutcome} from "fhir/r4"
import * as uuid from "uuid"
import {URLSearchParams} from "url"
import {AxiosRequestHeaders, AxiosResponse} from "axios"

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
    const requestId = uuid.v4()
    const rawResponseHeaders = {
      "x-raw-response": "true"
    }
    const response = await this.makeApiCall<OperationOutcome>("$process-message", body, undefined, requestId)
    const statusCode = response.status
    const fhirResponse = response.data
    const spineResponse = (await this.makeApiCall<string | OperationOutcome>("$process-message", body, undefined, requestId, rawResponseHeaders)).data
    return {statusCode, fhirResponse, spineResponse}
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
    return {statusCode, fhirResponse, spineResponse}
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
    return {statusCode, fhirResponse, spineResponse}
  }

  async makeConvertRequest(body: FhirResource): Promise<string | OperationOutcome> {
    return (await this.makeApiCall<string>("$convert", body)).data
  }

  protected async makeApiCall<T>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    body?: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    params?: URLSearchParams,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    requestId?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    additionalHeaders?: AxiosRequestHeaders
  ): Promise<AxiosResponse<T>> {
    throw new Error("Method not implemented.")
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getEpsClient(accessToken: string): EpsClient {
  return isLocal()
    ? new SandboxEpsClient()
    : new LiveEpsClient(accessToken)
}

export interface EpsResponse<T> {
  statusCode: number,
  fhirResponse: T
  spineResponse: string | OperationOutcome
}
