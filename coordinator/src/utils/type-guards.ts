import {fhir} from "@models"

export function isOperationOutcome(body: unknown): body is fhir.OperationOutcome {
  return isFhirResourceOfType(body, "OperationOutcome")
}

export function isBundle(body: unknown): body is fhir.Bundle {
  return isFhirResourceOfType(body, "Bundle")
}

export function isParameters(body: unknown): body is fhir.Parameters {
  return isFhirResourceOfType(body, "Parameters")
}

export function isTask(body: unknown): body is fhir.Task {
  return isFhirResourceOfType(body, "Task")
}

export function isClaim(body: unknown): body is fhir.Claim {
  return isFhirResourceOfType(body, "Claim")
}

export function isMedicationRequest(body: unknown): body is fhir.MedicationRequest {
  return isFhirResourceOfType(body, "MedicationRequest")
}

export function isMedicationDispense(body: unknown): body is fhir.MedicationDispense {
  return isFhirResourceOfType(body, "MedicationDispense")
}

function isFhirResourceOfType(body: unknown, resourceType: string) {
  return typeof body === "object"
    && "resourceType" in body
    && (body as fhir.Resource).resourceType === resourceType
}

export function isReference<T extends fhir.Resource>(
  body: fhir.Reference<T> | fhir.IdentifierReference<T>
): body is fhir.Reference<T>{
  return !!(body as fhir.Reference<T>).reference
}
