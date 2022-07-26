import Hapi from "@hapi/hapi"
import {hl7V3, fhir, spine} from "@models"
import {extractHl7v3PrescriptionFromMessage} from "../../services/communication/tracker/tracker-response-parser"
import {spineClient} from "../../services/communication/spine-client"
import {BASE_PATH, ContentTypes, getPayload} from "../util"
import {getRequestId} from "../../utils/headers"
import {createInnerBundle} from "../../services/translation/response/release/release-response"

export default [{
  method: "POST",
  path: `${BASE_PATH}/Tracker`,
  handler: async (
    request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
  ): Promise<Hapi.Lifecycle.ReturnValue> => {
    const trackerRequest = getPayload(request) as spine.GetPrescriptionMetadataRequest
    trackerRequest.message_id = getRequestId(request.headers)
    request.logger.info(`Tracker - Received request:\n${JSON.stringify(trackerRequest)}`)
    const trackerResponse = await spineClient.track(trackerRequest, request.logger)
    request.logger.info(`Tracker - Received response:\n${trackerResponse.body}`)
    const hl7v3Prescription = extractHl7v3PrescriptionFromMessage(trackerResponse.body, request.logger)
    
    const response = hl7v3Prescription
      ? createFhirPrescriptionResponse(hl7v3Prescription)
      : createErrorResponse()

    return responseToolkit
      .response(response)
      .code(trackerResponse.statusCode)
      .type(ContentTypes.FHIR)
  }
}]

function createFhirPrescriptionResponse(hl7v3Prescription: hl7V3.ParentPrescription) {
  return createInnerBundle(hl7v3Prescription, "")
}

function createErrorResponse() {
  return fhir.createOperationOutcome([
    fhir.createOperationOutcomeIssue(
      fhir.IssueCodes.NOT_FOUND,
      "error",
      fhir.createCodeableConcept(
        "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
        "RESOURCE_NOT_FOUND",
        "Resource not found"
      ))
  ])
}
