import Hapi from "@hapi/hapi"
import {
  BASE_PATH,
  ContentTypes,
  externalValidator,
  getPayload
} from "../util"
import {
  fhir,
  hl7V3,
  spine,
  validationErrors as errors
} from "@models"
import {spineClient} from "../../services/communication/spine-client"
//import {createInnerBundle} from "../../services/translation/response/release/release-response"
import {getRequestId} from "../../utils/headers"
import {extractHl7v3PrescriptionFromMessage} from "../../services/communication/tracker/tracker-response-parser"
import {isBundle} from "../../utils/type-guards"
import {getMedicationRequests} from "../../services/translation/common/getResourcesOfType"
import {
  verifySignatureHasCorrectFormat,
  verifyPrescriptionSignatureValid,
  verifySignatureDigestMatchesPrescription
} from "../../services/signature-verification"
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
// 7. Translate each prescription from hl7v3 to fhir
// 8. Compare values from each translated fhir prescription to each prescription in the payload (list to be defined)
// 9. Return parameters result as before

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

        const result = await Promise.all(outerBundle.entry.map(async(entry: fhir.BundleEntry, index: number) => {
          const fhirPrescriptionFromRequest = entry.resource as fhir.Bundle
          const firstMedicationRequest = getMedicationRequests(fhirPrescriptionFromRequest)[0]
          const prescriptionId = firstMedicationRequest.groupIdentifier.value
          const trackerRequest: spine.GetPrescriptionMetadataRequest = {
            prescription_id: prescriptionId,
            from_asid: process.env.TRACKER_FROM_ASID,
            to_asid: process.env.TRACKER_TO_ASID,
            message_id: messageId,
            repeat_number: "1" // todo: parse from fhir prescription
          }
          const trackerResponse = await spineClient.track(trackerRequest, request.logger)
          const hl7v3PrescriptionFromTracker = extractHl7v3PrescriptionFromMessage(trackerResponse.body, request.logger)
          //const fhirPrescriptionFromTracker = createFhirPrescription(hl7v3PrescriptionFromTracker)
          // const errors = [
          //   ...verifyPrescriptionSignature(index, fhirPrescriptionFromRequest, hl7v3PrescriptionFromTracker),
          //   ...comparePrescriptions(fhirPrescriptionFromRequest, fhirPrescriptionFromTracker)
          // ]
          const response = verifyPrescriptionSignature(index, fhirPrescriptionFromRequest, hl7v3PrescriptionFromTracker)
          // todo: map errors to OperationOutcomeIssues
          return {response}
        }))

        return responseToolkit.response(result).code(200).type(ContentTypes.FHIR)
      }
    )
  }
]

// todo: consolidate with /tracker
// function createFhirPrescription(hl7v3Prescription: hl7V3.ParentPrescription) {
//   return createInnerBundle(hl7v3Prescription, "")
// }

// todo: move to module
// todo: refactor, split out error concern from building fhir concern
function verifyPrescriptionSignature(
  index: number,
  fhirPrescription: fhir.Bundle,
  hl7v3Prescription: hl7V3.ParentPrescription
) : fhir.MultiPartParameter {
  const validSignatureFormat = verifySignatureHasCorrectFormat(hl7v3Prescription)
  if (!validSignatureFormat) {
    const issue: Array<fhir.OperationOutcomeIssue> = [
      createInvalidSignatureIssue("Invalid signature format.")
    ]
    return buildVerificationResultParameter(fhirPrescription, issue, index)
  }

  const validSignature = verifyPrescriptionSignatureValid(hl7v3Prescription)
  const matchingSignature = verifySignatureDigestMatchesPrescription(hl7v3Prescription)
  if (validSignature && matchingSignature) {
    const issue: Array<fhir.OperationOutcomeIssue> = [{
      severity: "information",
      code: fhir.IssueCodes.INFORMATIONAL
    }]
    return buildVerificationResultParameter(fhirPrescription, issue, index)
  } else {
    const issue: Array<fhir.OperationOutcomeIssue> = []
    if (!validSignature) {
      issue.push(createInvalidSignatureIssue("Signature is invalid."))
    }
    if (!matchingSignature) {
      issue.push(createInvalidSignatureIssue("Signature doesn't match prescription."))
    }
    return buildVerificationResultParameter(fhirPrescription, issue, index)
  }
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

// todo: move to module
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function comparePrescriptions(prescription1: fhir.Bundle, prescription2: fhir.Bundle)
: Array<string> {
  return []
}
