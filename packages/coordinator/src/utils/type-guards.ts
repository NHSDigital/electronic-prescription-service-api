import {fhir} from "@models"
import {
  Dose,
  DoseRange,
  DoseSimpleQuantity,
  Rate,
  RateRange,
  RateRatio,
  RateSimpleQuantity
} from "../../../models/fhir"

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

export function isPractitionerRole(body: unknown): body is fhir.PractitionerRole {
  return isFhirResourceOfType(body, "PractitionerRole")
}

export function isOrganization(body: unknown): body is fhir.Organization {
  return isFhirResourceOfType(body, "Organization")
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

export function isIdentifierReference<T extends fhir.Resource>(
  body: fhir.Reference<T> | fhir.IdentifierReference<T>
): body is fhir.IdentifierReference<T>{
  return !!(body as fhir.IdentifierReference<T>).identifier
}

export function isDoseSimpleQuantity(element: Dose): element is DoseSimpleQuantity {
  return "doseQuantity" in element
}

export function isDoseRange(element: Dose): element is DoseRange {
  return "doseRange" in element
}

export function isRateSimpleQuantity(element: Rate): element is RateSimpleQuantity {
  return "rateQuantity" in element
}

export function isRateRange(element: Rate): element is RateRange {
  return "rateRange" in element
}

export function isRateRatio(element: Rate): element is RateRatio {
  return "rateRatio" in element
}
