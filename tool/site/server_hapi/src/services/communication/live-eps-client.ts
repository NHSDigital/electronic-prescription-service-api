import * as uuid from "uuid"
import axios from "axios"
import {EpsClient} from "./eps-client"

export class LiveEpsClient implements EpsClient {
  private accessToken = ""

  setAccessToken(accessToken: string): void {
    this.accessToken = accessToken
  }

  async makePrepareRequest(body: unknown): Promise<any> {
    return await this.makeApiCall("$prepare", body)
  }

  private async makeApiCall(endpoint: string, body?: unknown): Promise<any> {
    const url = `https://${process.env.APIGEE_DOMAIN_NAME}/electronic-prescriptions/FHIR/R4/${endpoint}`
    const headers = {
      "Authorization": `Bearer ${this.accessToken}`,
      "x-request-id": uuid.v4(),
      "x-correlation-id": uuid.v4()
    }
    if (body) {
      return (await axios.post(url, {
        headers: headers,
        body
      })).data
    }

    return (await axios.get(url, {
      headers: headers
    })).data
  }
}
