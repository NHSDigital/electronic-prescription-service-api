import {RequestHandler} from "."
import {SpineRequest, SpineResponse} from "../../models/spine"

export class SandboxHandler implements RequestHandler {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async send(SpineResponse: SpineRequest): Promise<SpineResponse<unknown>> {
    return Promise.resolve({
      pollingUrl: "_poll/9807d292_074a_49e8_b48d_52e5bbf785ed",
      statusCode: 202
    })
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async poll(path: string): Promise<SpineResponse<unknown>> {
    return Promise.resolve({
      statusCode: 200,
      body: "Message Sent"
    })
  }
}
