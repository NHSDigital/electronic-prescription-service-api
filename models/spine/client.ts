export type ClientRequest = SpineRequest | TrackerRequest

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

export interface TrackerRequest {
  name: string
  headers: unknown
  body: string
}

export function isDirect<T>(spineResponse: SpineResponse<T>): spineResponse is SpineDirectResponse<T> {
  return !isPollable(spineResponse)
}

export function isPollable<T>(spineResponse: SpineResponse<T>): spineResponse is SpinePollableResponse {
  return "pollingUrl" in spineResponse
}

export function isTrackerRequest(req: ClientRequest): req is TrackerRequest {
  return (req as TrackerRequest).name !== undefined
}

