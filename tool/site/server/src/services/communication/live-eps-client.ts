import * as uuid from "uuid"
import {AxiosRequestHeaders} from "axios"
import {EpsClient} from "./eps-client"

export class LiveEpsClient extends EpsClient {
  private accessToken: string

  constructor(accessToken: string) {
    super()
    this.accessToken = accessToken
  }

  protected override getHeaders(requestId: string | undefined): AxiosRequestHeaders {
    return {
      "Authorization": `Bearer ${this.accessToken}`,
      "x-request-id": requestId ?? uuid.v4(),
      "x-correlation-id": uuid.v4()
    }
  }
}
