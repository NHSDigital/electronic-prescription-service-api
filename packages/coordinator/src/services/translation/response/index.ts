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
import {DispensePropsalReturnHandler} from "./spine-return-handler"
import {DispenseReturnPayloadFactory} from "../request/return/payload/return-payload-factory"
import {spineClient} from "../../../../src/services/communication/spine-client"

export const APPLICATION_ACKNOWLEDGEMENT_HANDLER = new SpineResponseHandler("MCCI_IN010000UK13")
export const CANCEL_RESPONSE_HANDLER = new CancelResponseHandler("PORX_IN050101UK31")
export const RELEASE_REJECTION_HANDLER = new ReleaseRejectionHandler("PORX_IN110101UK30")

const spineResponseHandlers : Array<SpineResponseHandler<unknown>> = [
  APPLICATION_ACKNOWLEDGEMENT_HANDLER,
  CANCEL_RESPONSE_HANDLER,
  RELEASE_REJECTION_HANDLER
]

export function createReleaseHandlers(requestHeaders: Hapi.Utils.Dictionary<string>) : Array<ReleaseResponseHandler> {
  const NOMINATED_RELEASE_RESPONSE_HANDLER = new ReleaseResponseHandler(
    "PORX_IN070101UK31",
    new DispensePropsalReturnHandler(requestHeaders,
      new DispenseReturnPayloadFactory(), spineClient)
  )
  const PATIENT_RELEASE_RESPONSE_HANDLER = new ReleaseResponseHandler(
    "PORX_IN070103UK31",
    new DispensePropsalReturnHandler(requestHeaders,
      new DispenseReturnPayloadFactory(), spineClient)
  )
  return [
    NOMINATED_RELEASE_RESPONSE_HANDLER,
    PATIENT_RELEASE_RESPONSE_HANDLER
  ]
}

export async function translateToFhir<T>(
  hl7Message: spine.SpineDirectResponse<T>,
  logger: pino.Logger,
  requestHeaders: Hapi.Utils.Dictionary<string>): Promise<TranslatedSpineResponse> {
  const responseHandlers = [...createReleaseHandlers(requestHeaders), ...spineResponseHandlers]
  const bodyString = hl7Message.body.toString()

  for (const handler of responseHandlers) {
    const translatedSpineResponse = await handler.handleResponse(bodyString, logger)
    if (translatedSpineResponse) {
      return translatedSpineResponse
    }
  }
  logger.error({hl7Message: hl7Message}, "Unhandled Spine response")
  return SpineResponseHandler.createServerErrorResponse()
}
