import Hapi from "@hapi/hapi"
import * as LosslessJson from "lossless-json"
import {hl7V3, fhir, spine} from "@models"
import {extractHl7v3PrescriptionFromMessage} from "../../services/communication/tracker/tracker-response-parser"
import {spineClient} from "../../services/communication/spine-client"
import {BASE_PATH, ContentTypes} from "../util"
import {getRequestId} from "../../utils/headers"
import {createBundle} from "../../services/translation/common/response-bundles"

// todo:
// 1. Move generic tracker request fields to secrets - done
// 2. Update to GET request - done
// 2a. Handle case when prescription does NOT exist
// 3. Refactor mapping for HL7 to FHIR from release response to be re-usable, override where different
// 4. Upgrade to this tracker in tool
// 5. Parametise creation_time in both tracker templates
// 6. Update sandbox response to a hardcoded example with ASIDs redacted see `sandbox-spine-client - track`
// 7. Add a check to ensure prescription id in document response is correct
// 8. Check if any attributes are optional from metadata and document responses and handle relevant scenarios

// Cases to test:
// prescription exists
// prescription does not exist
// prescription cancelled
// wrong document type from metadata request
// permissions (asids) check?
// validate query params
// default repeat number to 1
// API rate limits?

/* The PAUI Tracker */

export default [{
  method: "GET",
  path: `${BASE_PATH}/Tracker`,
  handler: async (
    request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
  ): Promise<Hapi.Lifecycle.ReturnValue> => {

    const trackerRequest: spine.GetPrescriptionMetadataRequest = {
      message_id: getRequestId(request.headers),
      from_asid: process.env.TRACKER_FROM_ASID,
      to_asid: process.env.TRACKER_TO_ASID,
      prescription_id: request.query.prescription_id as string,
      repeat_number: request.query.repeat_number as string
    }

    request.logger.info(`Tracker - Received tracker request: ${LosslessJson.stringify(trackerRequest)}`)

    const trackerResponse = await spineClient.track(trackerRequest, request.logger)
    request.logger.info(`Tracker - Received tracker response: ${trackerResponse.body}`)

    // TODO: verify the message ID we get back from Spine to see if it's the same one we are sending
    const hl7v3Prescription = extractHl7v3PrescriptionFromMessage(trackerResponse.body, request.logger)

    const response = hl7v3Prescription
      ? createFhirPrescriptionResponse(hl7v3Prescription)
      : createErrorResponse()

    return responseToolkit
      .response(LosslessJson.stringify(response))
      .code(trackerResponse.statusCode)
      .type(ContentTypes.FHIR)
  }
}]

function createFhirPrescriptionResponse(hl7v3Prescription: hl7V3.ParentPrescription) {
  // TODO: pass request/response messageID
  return createBundle(hl7v3Prescription, "")
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
