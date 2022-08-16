import Hapi from "@hapi/hapi"
import * as LosslessJson from "lossless-json"
import {hl7V3, fhir} from "@models"
import {BASE_PATH, ContentTypes} from "../util"
import {getRequestId} from "../../utils/headers"
import {createBundle} from "../../services/translation/common/response-bundles"
import {trackerClient} from "../../services/communication/tracker/tracker-client"

/* The PAUI Tracker */

export default [{
  method: "GET",
  path: `${BASE_PATH}/Tracker`,
  handler: async (
    request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
  ): Promise<Hapi.Lifecycle.ReturnValue> => {
    const requestQuery = {
      prescription_id: request.query.prescription_id as string,
      repeat_number: request.query.repeat_number as string
    }

    const clientResponse = await trackerClient.track(
      getRequestId(request.headers),
      requestQuery.prescription_id,
      requestQuery.repeat_number,
      request.logger
    )

    const response = !!clientResponse.prescription
      ? createFhirPrescriptionResponse(clientResponse.prescription)
      : createErrorResponse(clientResponse.error.errorCode, clientResponse.error.errorMessage)

    return responseToolkit
      .response(response)
      .code(clientResponse.statusCode)
      .type(ContentTypes.FHIR)
  }
}]

// todo: consolidate with /$verify-signature
function createFhirPrescriptionResponse(hl7v3Prescription: hl7V3.ParentPrescription) {
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
