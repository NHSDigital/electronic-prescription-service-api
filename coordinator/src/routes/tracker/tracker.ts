import Hapi from "@hapi/hapi"
import * as LosslessJson from "lossless-json"
import {hl7V3, fhir} from "@models"
import {BASE_PATH, ContentTypes} from "../util"
import {getRequestId} from "../../utils/headers"
import {createBundle} from "../../services/translation/common/response-bundles"
import {trackerClient} from "../../services/communication/tracker/tracker-client"

// todo:
// 1. Move generic tracker request fields to secrets - done
// 2. Update to GET request - done
// 2a. Handle case when prescription does NOT exist
// 3. Refactor mapping for HL7 to FHIR from release response to be re-usable, override where different
// #-> still need to get the prescription status
// 4. Upgrade to this tracker in tool
// 5. Parametise creation_time in both tracker templates - DONE
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
    const response = await trackerClient.track(
      getRequestId(request.headers),
      request.query.prescription_id as string,
      request.query.repeat_number as string,
      request.logger
    )

    const fhirResponse = response.prescription
      ? createFhirPrescriptionResponse(response.prescription)
      : createErrorResponse(response.error.errorCode, response.error.errorMessage)

    return responseToolkit
      .response(LosslessJson.stringify(fhirResponse))
      .code(response.statusCode)
      .type(ContentTypes.FHIR)
  }
}]

function createFhirPrescriptionResponse(hl7v3Prescription: hl7V3.ParentPrescription): fhir.Bundle {
  // TODO: pass request/response messageID
  return createBundle(hl7v3Prescription, "")
}

function createErrorResponse(errorCode: string, errorMessage: string): fhir.OperationOutcome {
  return fhir.createOperationOutcome([
    fhir.createOperationOutcomeIssue(
      fhir.IssueCodes.NOT_FOUND,
      "error",
      fhir.createCodeableConcept(
        "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
        errorCode,
        errorMessage
      ))
  ])
}
