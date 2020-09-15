export type SpineResponse = SpineDirectResponse | SpinePollableResponse

export interface SpineDirectResponse {
  body: string
  statusCode: number
}

export interface SpinePollableResponse {
  pollingUrl: string
  statusCode: number
}

export function isDirect(spineResponse: SpineResponse): spineResponse is SpineDirectResponse {
  return !isPollable(spineResponse)
}

export function isPollable(spineResponse: SpineResponse): spineResponse is SpinePollableResponse {
  return "pollingUrl" in spineResponse
}
