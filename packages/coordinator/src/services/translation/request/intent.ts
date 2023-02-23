import {fhir, processingErrors as errors} from "@models"

export function getIntent(medicationRequests: Array<fhir.MedicationRequest>): string {
  const intentList = medicationRequests
    .map(medicationRequest => medicationRequest.intent)

  const intentSet = new Set(intentList)
  if (intentSet.size === 1) {
    return intentSet.values().next().value
  } else {
    throw new errors.InvalidValueError(
      "Intent must match for all MedicationRequests.",
      "MedicationRequest.intent"
    )
  }
}
