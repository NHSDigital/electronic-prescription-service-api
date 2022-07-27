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
import {createInnerBundle} from "../../services/translation/response/release/release-response"
import {getRequestId} from "../../utils/headers"
import {extractHl7v3PrescriptionFromMessage} from "../../services/communication/tracker/tracker-response-parser"
import {isBundle} from "../../utils/type-guards"
import {getMedicationRequests} from "../../services/translation/common/getResourcesOfType"

// todo:
// 1. Remove VerifySignatureTemp payload - DONE
// 2. Ensure endpoint accepts the following types of payload:
//  2a. bulk release response - DONE
//  2b. single release response
//  2c. parent prescription
// 3. Re-instate external validator - DONE
// 4. Extract prescription id(s)/repeat-numbers from request - WIP
// 5. Use extracted prescription id(s) to track hl7v3 prescription(s) - DONE
// 6. Verify digest, signature, certificate (certificate work is happening in parallel) for each prescription
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

        const result = await Promise.all(outerBundle.entry.map(async(entry: fhir.BundleEntry) => {
          const fhirprescriptionFromRequest = entry.resource as fhir.Bundle
          const firstMedicationRequest = getMedicationRequests(fhirprescriptionFromRequest)[0]
          const prescriptionId = firstMedicationRequest.groupIdentifier.value
          const trackerRequest: spine.GetPrescriptionMetadataRequest = {
            prescription_id: prescriptionId,
            from_asid: process.env.TRACKER_FROM_ASID,
            to_asid: process.env.TRACKER_TO_ASID,
            message_id: messageId,
            repeat_number: "1" // todo: parse from fhir prescription
          }
          const trackerResponse = await spineClient.track(trackerRequest, request.logger)
          console.log(trackerResponse.body)
          const hl7v3PrescriptionFromTracker = extractHl7v3PrescriptionFromMessage(trackerResponse.body, request.logger)
          const fhirPrescriptionFromTracker = createFhirPrescription(hl7v3PrescriptionFromTracker)
          const errors = [
            ...verifyPrescriptionSignature(hl7v3PrescriptionFromTracker),
            ...comparePrescriptions(fhirprescriptionFromRequest, fhirPrescriptionFromTracker)
          ]
          return {success: !errors.length, errors}
        }))

        return responseToolkit.response(result).code(200).type(ContentTypes.FHIR)
      }
    )
  }
]

// todo: consolidate with /tracker
function createFhirPrescription(hl7v3Prescription: hl7V3.ParentPrescription) {
  return createInnerBundle(hl7v3Prescription, "")
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function verifyPrescriptionSignature(prescription: hl7V3.ParentPrescription)
: Array<string> {
  return []
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function comparePrescriptions(prescription1: fhir.Bundle, prescription2: fhir.Bundle)
: Array<string> {
  return []
}
