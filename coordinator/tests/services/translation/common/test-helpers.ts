import {ExampleSpineResponse} from "../../../resources/test-resources"
import {hl7V3} from "@models"
import {CANCEL_RESPONSE_HANDLER} from "../../../../src/services/translation/response"

export function hasCorrectISOFormat(timestamp: string): boolean {
  const ISOTimestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/
  return ISOTimestampRegex.test(timestamp)
}

export function getCancellationResponse(actualError: ExampleSpineResponse): hl7V3.CancellationResponse {
  const sendMessagePayload = CANCEL_RESPONSE_HANDLER.extractSendMessagePayload(actualError.response.body)
  return sendMessagePayload.ControlActEvent.subject.CancellationResponse
}
