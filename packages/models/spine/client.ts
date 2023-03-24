export type ClientRequest = SpineRequest | TrackerRequest
import {RawAxiosRequestHeaders} from "axios"

export interface SpineRequest {
  message: string
  interactionId: string
  messageId: string
  conversationId: string
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
  headers: RawAxiosRequestHeaders
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
