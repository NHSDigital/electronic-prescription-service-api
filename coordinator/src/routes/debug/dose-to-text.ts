import {BASE_PATH, ContentTypes, externalValidator, getPayload, isBundle, isMedicationRequest} from "../util"
import {fhir} from "@models"
import {stringifyDosages} from "../../services/translation/request/dosage"
import {getMedicationRequests} from "../../services/translation/common/getResourcesOfType"
import {getIdentifierValueOrNullForSystem} from "../../services/translation/common"

export default [
  /*
    Validate a FHIR message using the external FHIR validator.
  */
  {
    method: "POST",
    path: `${BASE_PATH}/$dose-to-text`,
    handler: externalValidator(async (request, responseToolkit) => {
      const payload = getPayload(request) as fhir.Resource
      if (isBundle(payload)) {
        request.logger.info("Converting structured dosage instructions to text (multiple MedicationRequests)")
        const medicationRequests = getMedicationRequests(payload)
        if (request.headers["accept"] === ContentTypes.PLAIN_TEXT) {
          const response = medicationRequests.map(doseToTextPlain).join("\n\n")
          return responseToolkit.response(response).code(200).type(ContentTypes.PLAIN_TEXT)
        }
        const response = medicationRequests.map(doseToTextJson)
        return responseToolkit.response(response).code(200).type(ContentTypes.JSON)
      } else if (isMedicationRequest(payload)) {
        request.logger.info("Converting structured dosage instructions to text (single MedicationRequest)")
        if (request.headers["accept"] === ContentTypes.PLAIN_TEXT) {
          const response = doseToTextPlain(payload)
          return responseToolkit.response(response).code(200).type(ContentTypes.PLAIN_TEXT)
        }
        const response = doseToTextJson(payload)
        return responseToolkit.response(response).code(200).type(ContentTypes.JSON)
      } else {
        const response = "Request body must be a Bundle or MedicationRequest."
        return responseToolkit.response(response).code(400).type(ContentTypes.PLAIN_TEXT)
      }
    })
  }
]

function doseToTextJson(medicationRequest: fhir.MedicationRequest) {
  return {
    groupIdentifier: medicationRequest.groupIdentifier,
    identifier: medicationRequest.identifier,
    dosageInstructionText: stringifyDosages(medicationRequest.dosageInstruction)
  }
}

function doseToTextPlain(medicationRequest: fhir.MedicationRequest) {
  const prescriptionId = getIdentifierValueOrNullForSystem(
    [medicationRequest.groupIdentifier],
    "https://fhir.nhs.uk/Id/prescription-order-number",
    "MedicationRequest.groupIdentifier"
  )
  const lineItemId = getIdentifierValueOrNullForSystem(
    medicationRequest.identifier,
    "https://fhir.nhs.uk/Id/prescription-order-item-number",
    "MedicationRequest.identifier"
  )
  return `Prescription ID: ${prescriptionId}\n`
    + `Line item ID: ${lineItemId}\n`
    + `Dosage instruction text: ${stringifyDosages(medicationRequest.dosageInstruction)}`
}
