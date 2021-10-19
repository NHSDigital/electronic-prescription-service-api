import * as uuid from "uuid"
import axios, {AxiosRequestHeaders} from "axios"
import {Bundle, OperationOutcome, Parameters} from "fhir/r4"
import {EpsClient} from "./eps-client"

export class LiveEpsClient implements EpsClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async makePrepareRequest(body: Bundle): Promise<Parameters> {
    return await this.makeApiCall("$prepare", body)
  }

  async makeSendRequest(requestId: string, body: Bundle, getSpineResponse: boolean): Promise<OperationOutcome> {
    return await this.makeApiCall("$process-message", body, requestId, getSpineResponse)
  }

  async makeConvertRequest(body: unknown): Promise<string> {
    return await this.makeApiCall("$convert", body)
  }

  private async makeApiCall(endpoint: string, body?: unknown, requestId?: string, getSpineResponse?: boolean): Promise<any> {
    const url = `https://${process.env.APIGEE_DOMAIN_NAME}/electronic-prescriptions/FHIR/R4/${endpoint}`
    let headers: AxiosRequestHeaders = {
      "Authorization": `Bearer ${this.accessToken}`,
      "x-request-id": requestId ?? uuid.v4(),
      "x-correlation-id": uuid.v4()
    }
    if (getSpineResponse) {
      headers = {
        ...headers,
        "x-raw-response": "true"
      }
    }
    if (body) {
      return (await axios.post(url, body, {headers: headers})).data
    }

    return (await axios.get(url, {headers: headers})).data
  }
}
