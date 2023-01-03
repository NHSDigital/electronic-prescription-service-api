import {spine} from "@models"
import {
  CancelResponseHandler,
  ReleaseRejectionHandler,
  ReleaseResponseHandler,
  SpineResponseHandler,
  TranslatedSpineResponse
} from "./spine-response-handler"
import * as pino from "pino"
import Hapi from "@hapi/hapi"
import {DispensePropsalReturnhandler} from "./spine-return-handler"
import {DispenseReturnPayloadFactory} from "../request/return/payload/return-payload-factory"

function createHandlers( requestHeaders: Hapi.Util.Dictionary<string>) : SpineResponseHandler<unknown>[] {
   const APPLICATION_ACKNOWLEDGEMENT_HANDLER = new SpineResponseHandler("MCCI_IN010000UK13")
   const CANCEL_RESPONSE_HANDLER = new CancelResponseHandler("PORX_IN050101UK31")
   const RELEASE_REJECTION_HANDLER = new ReleaseRejectionHandler("PORX_IN110101UK30")
   const NOMINATED_RELEASE_RESPONSE_HANDLER = new ReleaseResponseHandler(
    "PORX_IN070101UK31", 
    new DispensePropsalReturnhandler(requestHeaders,
      new DispenseReturnPayloadFactory())
    )
   const PATIENT_RELEASE_RESPONSE_HANDLER = new ReleaseResponseHandler(
    "PORX_IN070103UK31",
    new DispensePropsalReturnhandler(requestHeaders,
      new DispenseReturnPayloadFactory())
   )

  return [
    APPLICATION_ACKNOWLEDGEMENT_HANDLER,
    CANCEL_RESPONSE_HANDLER,
    RELEASE_REJECTION_HANDLER,
    NOMINATED_RELEASE_RESPONSE_HANDLER,
    PATIENT_RELEASE_RESPONSE_HANDLER
  ]
}

export function translateToFhir<T>(
  hl7Message: spine.SpineDirectResponse<T>,
  logger: pino.Logger,
  requestHeaders?: Hapi.Util.Dictionary<string>): TranslatedSpineResponse {
  const spineResponseHandlers =  createHandlers(requestHeaders)
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
