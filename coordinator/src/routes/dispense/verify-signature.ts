import Hapi from "@hapi/hapi"
import {
  BASE_PATH,
  ContentTypes,
  externalValidator,
  getPayload
} from "../util"
import {fhir, spine, validationErrors as errors} from "@models"
import {spineClient} from "../../services/communication/spine-client"
import {getRequestId} from "../../utils/headers"
import {extractHl7v3PrescriptionFromMessage} from "../../services/communication/tracker/tracker-response-parser"
import {isBundle} from "../../utils/type-guards"
import {getMedicationRequests} from "../../services/translation/common/getResourcesOfType"
import {verifySignature} from "../../services/signature-verification"
import {buildVerificationResultParameter} from "../../utils/build-verification-result-parameter"

// todo:
// 1. Remove VerifySignatureTemp payload - DONE
// 2. Ensure endpoint accepts the following types of payload:
//  2a. bulk release response - DONE
//  2b. single release response
//  2c. parent prescription
// 3. Re-instate external validator - DONE
// 4. Extract prescription id(s)/repeat-numbers from request - WIP
// 5. Use extracted prescription id(s) to track hl7v3 prescription(s) - DONE
// 6. Verify digest, signature for each prescription - DONE
// 7. Return parameters result as before - DONE

export default [
  /*
      Verify prescription signatures.
    */
  {
    method: "POST",
    path: `${BASE_PATH}/$verify-signature`,
    handler: externalValidator(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
        const messageId = getRequestId(request.headers)

        const outerBundle = getPayload(request) as fhir.Resource
        if (!isBundle(outerBundle)) {
          const operationOutcome = fhir.createOperationOutcome([
            errors.createResourceTypeIssue("Bundle")
          ])
          return responseToolkit.response(operationOutcome).code(400).type(ContentTypes.FHIR)
        }

        request.logger.info("Verifying prescription signatures")

        const response = await Promise.all(outerBundle.entry.map(async(entry: fhir.BundleEntry, index: number) => {
          const fhirPrescriptionFromRequest = entry.resource as fhir.Bundle
          const firstMedicationRequest = getMedicationRequests(fhirPrescriptionFromRequest)[0]
          const prescriptionId = firstMedicationRequest.groupIdentifier.value
          const repeatNumber = "1" // todo: parse from fhir prescription
          const trackerRequest = spine.buildPrescriptionMetadataRequest(messageId, prescriptionId, repeatNumber)
          const trackerResponse = await spineClient.track(trackerRequest, request.logger)
          const hl7v3PrescriptionFromTracker = extractHl7v3PrescriptionFromMessage(trackerResponse.body, request.logger)
          const errors = verifySignature(hl7v3PrescriptionFromTracker)
          const partialResponse = createFhirPartialResponse(index, fhirPrescriptionFromRequest, errors)
          return {partialResponse}
        }))

        return responseToolkit.response(response).code(200).type(ContentTypes.FHIR)
      }
    )
  }
]

function createFhirPartialResponse(
  index: number,
  prescription: fhir.Bundle,
  errors: Array<string>
): fhir.MultiPartParameter {
  if (errors.length) {
    const issue = errors.map(e => createInvalidSignatureIssue(e))
    return buildVerificationResultParameter(prescription, issue, index)
  }

  const issue: Array<fhir.OperationOutcomeIssue> = [{
    severity: "information",
    code: fhir.IssueCodes.INFORMATIONAL
  }]
  return buildVerificationResultParameter(prescription, issue, index)
}

function createInvalidSignatureIssue(display: string): fhir.OperationOutcomeIssue {
  return {
    severity: "error",
    code: fhir.IssueCodes.INVALID,
    details: {
      coding: [{
        system: "https://fhir.nhs.uk/CodeSystem/Spine-ErrorOrWarningCode",
        code: "INVALID",
        display
      }]
    },
    expression: ["Provenance.signature.data"]
  }
}
