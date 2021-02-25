import {ExampleSpineResponse} from "../../../resources/test-resources"
import * as hl7V3 from "../../../../src/models/hl7-v3"
import {CANCEL_RESPONSE_HANDLER} from "../../../../src/services/translation/response"

export function hasCorrectISOFormat(timestamp: string): boolean {
  const ISOTimestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/
  return ISOTimestampRegex.test(timestamp)
}

export function getCancellationResponse(actualError: ExampleSpineResponse): hl7V3.CancellationResponse {
  const sendMessagePayload = CANCEL_RESPONSE_HANDLER.extractSendMessagePayload(actualError.response.body)
  return sendMessagePayload.ControlActEvent.subject.CancellationResponse
}
