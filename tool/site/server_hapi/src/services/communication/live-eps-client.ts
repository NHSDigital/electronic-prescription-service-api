import * as uuid from "uuid"
import axios, {AxiosRequestHeaders, AxiosResponse} from "axios"
import {Bundle, Claim, FhirResource, OperationOutcome, Parameters} from "fhir/r4"
import {EpsClient, EpsResponse} from "./eps-client"
import {URLSearchParams} from "url"

export class LiveEpsClient extends EpsClient {
  private accessToken: string

  constructor(accessToken: string) {
    super()
    this.accessToken = accessToken
  }

  protected override async makeApiCall<T>(
    path: string,
    body?: unknown,
    params?: URLSearchParams,
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
      data: body,
      params
    })
  }
}
