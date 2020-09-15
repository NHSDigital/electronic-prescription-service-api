import {Handler} from "."
import {SpineResponse} from "../../models/spine/responses"

export class SandboxHandler implements Handler {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async send(message: string): Promise<SpineResponse> {
    return Promise.resolve({
      pollingUrl: "_poll/9807d292_074a_49e8_b48d_52e5bbf785ed",
      statusCode: 202
    })
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async poll(path: string): Promise<SpineResponse> {
    return Promise.resolve({
      statusCode: 200,
      body: "Message Sent"
    })
  }
}
