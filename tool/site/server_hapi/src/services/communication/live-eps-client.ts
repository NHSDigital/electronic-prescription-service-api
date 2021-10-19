import * as uuid from "uuid"
import axios from "axios"
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

  async makeSendRequest(body: Bundle): Promise<OperationOutcome> {
    return await this.makeApiCall("$process-message", body)
  }

  async makeConvertRequest(body: unknown): Promise<string> {
    return await this.makeApiCall("$convert", body)
  }

  private async makeApiCall(endpoint: string, body?: unknown): Promise<any> {
    const url = `https://${process.env.APIGEE_DOMAIN_NAME}/electronic-prescriptions/FHIR/R4/${endpoint}`
    const headers = {
      "Authorization": `Bearer ${this.accessToken}`,
      "x-request-id": uuid.v4(),
      "x-correlation-id": uuid.v4()
    }
    if (body) {
      return (await axios.post(url, body, {headers: headers})).data
    }

    return (await axios.get(url, {headers: headers})).data
  }
}
