import {SpineDirectResponse} from "../../../models/spine"
import {
  CancelResponseHandler,
  ReleaseResponseHandler,
  SpineResponseHandler,
  TranslatedSpineResponse
} from "./spine-response-handler"

export const APPLICATION_ACKNOWLEDGEMENT_HANDLER = new SpineResponseHandler("MCCI_IN010000UK13")
export const CANCEL_RESPONSE_HANDLER = new CancelResponseHandler("PORX_IN050101UK31")
export const RELEASE_RESPONSE_HANDLER = new ReleaseResponseHandler("PORX_IN070101UK31")

const spineResponseHandlers = [
  APPLICATION_ACKNOWLEDGEMENT_HANDLER,
  CANCEL_RESPONSE_HANDLER,
  RELEASE_RESPONSE_HANDLER
]

export function translateToFhir<T>(hl7Message: SpineDirectResponse<T>): TranslatedSpineResponse {
  const bodyString = hl7Message.body.toString()
  for (const handler of spineResponseHandlers) {
    const translatedSpineResponse = handler.handleResponse(bodyString)
    if (translatedSpineResponse) {
      return translatedSpineResponse
    }
  }
  return SpineResponseHandler.createErrorResponse()
}

// export function translateToFhir<T>(hl7Message: SpineDirectResponse<T>): TranslatedSpineResponse {
//   const bodyString = hl7Message.body.toString()
//
//   const releaseResponse = SPINE_PRESCRIPTION_RELEASE_RESPONSE_REGEX.exec(bodyString)
//   if (releaseResponse) {
//     const parsedMsg = readXmlStripNamespace(releaseResponse[0]) as hl7V3.PrescriptionReleaseResponseWrapperRoot
//     const sendMessagePayload = parsedMsg.PORX_IN070101UK31
//     //TODO - handle errors
//     const prescriptionReleaseResponse = sendMessagePayload.ControlActEvent.subject.PrescriptionReleaseResponse
//     return {
//       statusCode: translateAcknowledgementTypeCodeToStatusCode(getAcknowledgementTypeCode(sendMessagePayload)),
//       fhirResponse: createOuterBundle(prescriptionReleaseResponse)
//     }
//   }
//
//   const cancelResponse = SPINE_CANCELLATION_ERROR_RESPONSE_REGEX.exec(bodyString)
//   if (cancelResponse) {
//     const parsedMsg = readXmlStripNamespace(cancelResponse[0]) as hl7V3.CancellationResponseWrapperRoot
//     const sendMessagePayload = parsedMsg.PORX_IN050101UK31
//     const cancellationResponse = sendMessagePayload.ControlActEvent.subject.CancellationResponse
//     return {
//       statusCode: translateAcknowledgementTypeCodeToStatusCode(getAcknowledgementTypeCode(sendMessagePayload)),
//       fhirResponse: translateSpineCancelResponseIntoBundle(cancellationResponse)
//     }
//   }
//
//   const acknowledgement = SPINE_APPLICATION_ACKNOWLEDGEMENT_REGEX.exec(bodyString)
//   if (acknowledgement) {
//     const parsedMsg = readXmlStripNamespace(acknowledgement[0]) as hl7V3.ApplicationAcknowledgementWrapperRoot
//     const sendMessagePayload = parsedMsg.MCCI_IN010000UK13
//     return getFhirResponseAndErrorCodes(sendMessagePayload)
//   }
//
//   return {
//     statusCode: 400,
//     fhirResponse: {
//       resourceType: "OperationOutcome",
//       issue: [createOperationOutcomeIssue(400)]
//     } as fhir.OperationOutcome
//   }
// }

// function getFhirResponseAndErrorCodes<T>(
//   sendMessagePayload: hl7V3.SendMessagePayload<T>
// ): TranslatedSpineResponse {
//   const acknowledgementTypeCode = getAcknowledgementTypeCode(sendMessagePayload)
//   const statusCode = translateAcknowledgementTypeCodeToStatusCode(acknowledgementTypeCode)
//   return {
//     statusCode: statusCode,
//     fhirResponse: {
//       resourceType: "OperationOutcome",
//       issue: createOperationOutcomeIssues(sendMessagePayload)
//     } as fhir.OperationOutcome
//   }
// }

// function createOperationOutcomeIssues<T>(
//   sendMessagePayload: hl7V3.SendMessagePayload<T>
// ): Array<fhir.OperationOutcomeIssue> {
//   const acknowledgementTypeCode = getAcknowledgementTypeCode(sendMessagePayload)
//   switch (acknowledgementTypeCode) {
//     case hl7V3.AcknowledgementTypeCode.ACKNOWLEDGED:
//       return [{
//         code: "informational",
//         severity: "information"
//       }]
//     case hl7V3.AcknowledgementTypeCode.REJECTED:
//       return extractRejectionCodes(sendMessagePayload).map(toOperationOutcomeIssue)
//     case hl7V3.AcknowledgementTypeCode.ERROR:
//       return extractErrorCodes(sendMessagePayload).map(toOperationOutcomeIssue)
//     default:
//       throw new Error("Unhandled acknowledgement type code " + acknowledgementTypeCode)
//   }
// }

// eslint-disable-next-line max-len
// function translateAcknowledgementTypeCodeToStatusCode(acknowledgementTypeCode: hl7V3.AcknowledgementTypeCode): number {
//   switch (acknowledgementTypeCode) {
//     case hl7V3.AcknowledgementTypeCode.ACKNOWLEDGED:
//       return 200
//     case hl7V3.AcknowledgementTypeCode.ERROR:
//     case hl7V3.AcknowledgementTypeCode.REJECTED:
//     default:
//       return 400
//   }
// }
