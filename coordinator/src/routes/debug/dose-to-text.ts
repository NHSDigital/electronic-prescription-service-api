import {
  BASE_PATH,
  ContentTypes,
  externalValidator,
  getPayload,
  isBundle,
  isMedicationDispense,
  isMedicationRequest
} from "../util"
import {fhir} from "@models"
import {stringifyDosages} from "../../services/translation/request/dosage"
import {getMedicationDispenses, getMedicationRequests} from "../../services/translation/common/getResourcesOfType"

export default [
  /*
    Convert a FHIR dosage instruction to plain text.
  */
  {
    method: "POST",
    path: `${BASE_PATH}/$dose-to-text`,
    handler: externalValidator(async (request, responseToolkit) => {
      const payload = getPayload(request) as fhir.Resource
      const resources = getResourcesWithDosageInstructions(payload)
      if (!resources) {
        const response = "Request body must be a Bundle, MedicationRequest or MedicationDispense."
        return responseToolkit.response(response).code(400).type(ContentTypes.PLAIN_TEXT)
      }

      if (request.headers["accept"] === ContentTypes.PLAIN_TEXT) {
        const response = resources.map(doseToTextPlain).join("\n")
        return responseToolkit.response(response).code(200).type(ContentTypes.PLAIN_TEXT)
      }
      const response = resources.map(doseToTextJson)
      return responseToolkit.response(response).code(200).type(ContentTypes.JSON)
    })
  }
]

function getResourcesWithDosageInstructions(payload: fhir.Resource) {
  if (isBundle(payload)) {
    return [
      ...getMedicationRequests(payload),
      ...getMedicationDispenses(payload)
    ]
  } else if (isMedicationRequest(payload) || isMedicationDispense(payload)) {
    return [
      payload
    ]
  } else {
    return null
  }
}

function doseToTextJson(resource: fhir.MedicationRequest | fhir.MedicationDispense) {
  return {
    identifier: resource.identifier,
    dosageInstructionText: stringifyDosages(resource.dosageInstruction)
  }
}

function doseToTextPlain(resource: fhir.MedicationRequest | fhir.MedicationDispense) {
  stringifyDosages(resource.dosageInstruction)
}
