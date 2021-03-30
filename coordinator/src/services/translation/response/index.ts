import {spine} from "@models"
import {
  CancelResponseHandler,
  ReleaseResponseHandler,
  SpineResponseHandler,
  TranslatedSpineResponse
} from "./spine-response-handler"
import * as pino from "pino"
import * as cancelResponseTranslator from "./cancellation/cancellation-response"
import * as releaseResponseTranslator from "./release/release-response"

export const APPLICATION_ACKNOWLEDGEMENT_HANDLER = new SpineResponseHandler("MCCI_IN010000UK13")
export const CANCEL_RESPONSE_HANDLER = new CancelResponseHandler(
  "PORX_IN050101UK31",
  cancelResponseTranslator.translateSpineCancelResponseIntoBundle
)
export const RELEASE_RESPONSE_HANDLER = new ReleaseResponseHandler(
  "PORX_IN070101UK31",
  releaseResponseTranslator.createOuterBundle
)

const spineResponseHandlers = [
  APPLICATION_ACKNOWLEDGEMENT_HANDLER,
  CANCEL_RESPONSE_HANDLER,
  RELEASE_RESPONSE_HANDLER
]

export function translateToFhir<T>(
  hl7Message: spine.SpineDirectResponse<T>,
  logger: pino.Logger): TranslatedSpineResponse {
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
