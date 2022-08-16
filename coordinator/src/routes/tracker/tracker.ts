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

    const response = await trackerClient.track(
      getRequestId(request.headers),
      requestQuery.prescription_id,
      requestQuery.repeat_number,
      request.logger
    )

    const requestSuccessful = !!response.prescription
    const fhirResponse = requestSuccessful
      ? createFhirPrescriptionResponse(response.prescription)
      : createErrorResponse(response.error.errorCode, response.error.errorMessage)

    const result = {
      fhirRequest: requestQuery,
      xmlResponse: response.prescription,
      fhirResponse: fhirResponse
    }

    return responseToolkit
      .response(LosslessJson.stringify(result))
      .code(response.statusCode)
      .type(ContentTypes.JSON)
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
