import Hapi from "@hapi/hapi"
import {BASE_PATH, ContentTypes, getPayload} from "../util"
import {fhir, hl7V3, spine} from "@models"
import {spineClient} from "../../services/communication/spine-client"
import {createInnerBundle} from "../../services/translation/response/release/release-response"
import {getRequestId} from "../../utils/headers"
import {extractHl7v3PrescriptionFromMessage} from "../../services/communication/tracker/tracker-response-parser"

// todo:
// 1. Remove VerifySignatureTemp payload
// 2. Ensure endpoint accepts the following types of payload: bulk release response, single release response
//    and a parent prescription
// 3. Re-instate external validator
// 4. Extract prescription id(s) from request
// 5. Use extracted prescription id(s) to track hl7v3 prescription(s)
// 6. Verify digest, signature, certificate (certificate work is happening in parallel) for each prescription
// 7. Translate each prescription from hl7v3 to fhir
// 8. Compare values from each translated fhir prescription to each prescription in the payload (list to be defined)
// 9. Return parameters result as before

interface VerifySignatureTemp extends spine.GenericTrackerRequest {
  prescription_ids: []
  repeat_number: "1"
}

export default [
  /*
      Verify prescription signatures.
    */
  {
    method: "POST",
    path: `${BASE_PATH}/$verify-signature`,
    handler:
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
        const tempVerifyRequest = getPayload(request) as VerifySignatureTemp
        tempVerifyRequest.message_id = getRequestId(request.headers)

        request.logger.info("Verifying prescription signatures")

        const result = tempVerifyRequest.prescription_ids.map(async (id: string) => {
          const trackerRequest: spine.GetPrescriptionMetadataRequest = {
            prescription_id: id,
            from_asid: tempVerifyRequest.from_asid,
            to_asid: tempVerifyRequest.to_asid,
            message_id: tempVerifyRequest.message_id,
            repeat_number: tempVerifyRequest.repeat_number
          }
          const trackerResponse = await spineClient.track(trackerRequest, request.logger)
          const hl7v3Prescription = extractHl7v3PrescriptionFromMessage(trackerResponse.body, request.logger)
          const fhirPrescription = createFhirPrescription(hl7v3Prescription)
          const errors = [
            ...verifyPrescriptionSignature(hl7v3Prescription),
            ...comparePrescriptions(id, fhirPrescription)
          ]
          return {success: !errors.length, errors}
        })

        return responseToolkit.response(result).code(200).type(ContentTypes.FHIR)
      }
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
function comparePrescriptions(prescription1: string, prescription2: fhir.Bundle)
: Array<string> {
  return []
}
