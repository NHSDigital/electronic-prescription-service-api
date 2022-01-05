import * as uuid from "uuid"
import axios, {AxiosRequestHeaders, AxiosResponse} from "axios"
import {EpsClient} from "./base-eps-client"
import {URLSearchParams} from "url"

export class SandboxEpsClient extends EpsClient {
  protected override async makeApiCall<T>(
    path: string,
    body?: unknown,
    params?: URLSearchParams,
    requestId?: string,
    additionalHeaders?: AxiosRequestHeaders
  ): Promise<AxiosResponse<T>> {
    const url = process.env.EPS_URL
      ? `${process.env.EPS_URL}/${path}`
      : `https://${process.env.APIGEE_DOMAIN_NAME}/electronic-prescriptions/FHIR/R4/${path}`
    const headers: AxiosRequestHeaders = {
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
