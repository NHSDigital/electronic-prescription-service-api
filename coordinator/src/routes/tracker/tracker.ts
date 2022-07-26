import Hapi from "@hapi/hapi"
import {hl7V3, fhir, spine} from "@models"
import {extractHl7v3PrescriptionFromMessage} from "../../services/communication/tracker/tracker-response-parser"
import {spineClient} from "../../services/communication/spine-client"
import {BASE_PATH, ContentTypes, getPayload} from "../util"
import {getRequestId} from "../../utils/headers"
import {createInnerBundle} from "../../services/translation/response/release/release-response"
import {writeXmlStringPretty} from "../../services/serialisation/xml"

// todo:
// 1. Move generic tracker request fields to secrets
// 2. Update to GET request
// 3. Map HL7 to FHIR
// 4. Upgrade to this tracker in tool
// 5. Parametise creation_time in both tracker templates
// 6. Update sandbox response to a hardcoded example with ASIDs redacted see `sandbox-spine-client - track`
// 7. Add a check to ensure prescription id in document response is correct
// 8. Check if any attributes are optional from metadata and document responses and handle relevant scenarios 

/* The PAUI Tracker */

export default [{
  method: "POST",
  path: `${BASE_PATH}/Tracker`,
  handler: async (
    request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
  ): Promise<Hapi.Lifecycle.ReturnValue> => {
    const trackerRequest = getPayload(request) as spine.GetPrescriptionMetadataRequest
    trackerRequest.message_id = getRequestId(request.headers)
    const trackerResponse = await spineClient.track(trackerRequest, request.logger)
    
    const hl7v3Prescription = extractHl7v3PrescriptionFromMessage(trackerResponse.body, request.logger)
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const response = hl7v3Prescription
      ? createFhirPrescriptionResponse(hl7v3Prescription)
      : createErrorResponse()

    return responseToolkit
      .response(writeXmlStringPretty(hl7v3Prescription))
      .code(trackerResponse.statusCode)
      .type(ContentTypes.XML)
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
