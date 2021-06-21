export interface SpineRequest {
  message: string
  interactionId: string
  messageId?: string
  fromPartyKey: string
}

export type SpineResponse<T> = SpineDirectResponse<T> | SpinePollableResponse

export interface SpineDirectResponse<T> {
  body: T
  statusCode: number
}

export interface SpinePollableResponse {
  pollingUrl: string
  statusCode: number
}

export function isDirect<T>(spineResponse: SpineResponse<T>): spineResponse is SpineDirectResponse<T> {
  return !isPollable(spineResponse)
}

export function isPollable<T>(spineResponse: SpineResponse<T>): spineResponse is SpinePollableResponse {
  return "pollingUrl" in spineResponse
}
