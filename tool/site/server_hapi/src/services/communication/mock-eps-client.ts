import * as uuid from "uuid"
import axios from "axios"
import {Bundle, Parameters} from "fhir/r4"
import {EpsClient} from "./eps-client"

export class MockEpsClient implements EpsClient {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async makePrepareRequest(body: Bundle): Promise<Parameters> {
    return await this.mockAxiosResponse(
      {
        resourceType: "Parameters",
        parameter: [
          {
            name: "digest",
            // eslint-disable-next-line max-len
            valueString: "PFNpZ25lZEluZm8geG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyMiPjxDYW5vbmljYWxpemF0aW9uTWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8xMC94bWwtZXhjLWMxNG4jIj48L0Nhbm9uaWNhbGl6YXRpb25NZXRob2Q+PFNpZ25hdHVyZU1ldGhvZCBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyNyc2Etc2hhMSI+PC9TaWduYXR1cmVNZXRob2Q+PFJlZmVyZW5jZT48VHJhbnNmb3Jtcz48VHJhbnNmb3JtIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8xMC94bWwtZXhjLWMxNG4jIj48L1RyYW5zZm9ybT48L1RyYW5zZm9ybXM+PERpZ2VzdE1ldGhvZCBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyNzaGExIj48L0RpZ2VzdE1ldGhvZD48RGlnZXN0VmFsdWU+RGMvYldSb21tY2Z4OVhoOHE0czBaYUUwUFdZPTwvRGlnZXN0VmFsdWU+PC9SZWZlcmVuY2U+PC9TaWduZWRJbmZvPg=="
          },
          {
            name: "timestamp",
            valueString: "2021-05-07T14:47:53+00:00"
          },
          {
            name: "algorithm",
            valueString: "RS1"
          }
        ]
      })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async makeSendRequest(requestId: string, body: Bundle, getSpineResponse: boolean): Promise<unknown> {
    if (getSpineResponse) {
      const url = `https://${process.env.APIGEE_DOMAIN_NAME}/electronic-prescriptions/FHIR/R4/$process-message`
      const response = (await axios.post(url, body, {headers: {"X-Request-ID": uuid.v4(), "X-Raw-Response": "true"}})).data
      return response as string
    }

    return await this.mockAxiosResponse({
      resourceType: "OperationOutcome",
      issue: [
        {
          code: "informational",
          severity: "information"
        }
      ]
    })
  }

  async makeConvertRequest(body: unknown): Promise<string> {
    const url = `https://${process.env.APIGEE_DOMAIN_NAME}/electronic-prescriptions/FHIR/R4/$convert`
    const response = (await axios.post(url, body, {headers: {"X-Request-ID": uuid.v4()}})).data
    return response as string
  }

  private async mockAxiosResponse(body: unknown): Promise<any> {
    return Promise.resolve(body)
  }
}
