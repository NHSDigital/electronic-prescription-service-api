import {AxiosResponse} from "axios"

export class UnhandledAxiosResponseError extends Error {
  response: AxiosResponse

  constructor(message: string, response: AxiosResponse) {
    super(message)
    this.response = response
  }
}
