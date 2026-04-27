import {
  BASE_PATH,
  ContentTypes,
  externalValidator,
  getPayload
} from "../util"
import {fhir, validationErrors as errors} from "@models"
import {stringifyDosages} from "../../services/translation/request/dosage"
import {getMedicationDispenses, getMedicationRequests} from "../../services/translation/common/getResourcesOfType"
import {isBundle, isMedicationDispense, isMedicationRequest} from "../../utils/type-guards"
import {RouteDefMethods} from "@hapi/hapi"

export default [
  /*
    Convert a FHIR dosage instruction to plain text.
  */
  {
    method: "POST" as RouteDefMethods,
    path: `${BASE_PATH}/$dose-to-text`,
    handler: externalValidator(async (request, responseToolkit) => {
      const payload = await getPayload(request) as fhir.Resource
      const resources = getResourcesWithDosageInstructions(payload)
      if (!resources) {
        const response = fhir.createOperationOutcome(
          [errors.createResourceTypeIssue("Bundle, MedicationRequest or MedicationDispense")],
          payload.meta?.lastUpdated
        )
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
    return [...getMedicationRequests(payload), ...getMedicationDispenses(payload)]
  } else if (isMedicationRequest(payload) || isMedicationDispense(payload)) {
    return [payload]
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
