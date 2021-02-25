import {SpineDirectResponse} from "../../../models/spine"
import {
  CancelResponseHandler,
  ReleaseResponseHandler,
  SpineResponseHandler,
  TranslatedSpineResponse
} from "./spine-response-handler"
import * as pino from "pino"

export const APPLICATION_ACKNOWLEDGEMENT_HANDLER = new SpineResponseHandler("MCCI_IN010000UK13")
export const CANCEL_RESPONSE_HANDLER = new CancelResponseHandler("PORX_IN050101UK31")
export const RELEASE_RESPONSE_HANDLER = new ReleaseResponseHandler("PORX_IN070101UK31")

const spineResponseHandlers = [
  APPLICATION_ACKNOWLEDGEMENT_HANDLER,
  CANCEL_RESPONSE_HANDLER,
  RELEASE_RESPONSE_HANDLER
]

export function translateToFhir<T>(hl7Message: SpineDirectResponse<T>, logger: pino.Logger): TranslatedSpineResponse {
  const bodyString = hl7Message.body.toString()
  for (const handler of spineResponseHandlers) {
    const translatedSpineResponse = handler.handleResponse(bodyString, logger)
    if (translatedSpineResponse) {
      return translatedSpineResponse
    }
  }
  logger.error("Unhandled Spine response")
  return SpineResponseHandler.createServerErrorResponse()
}
