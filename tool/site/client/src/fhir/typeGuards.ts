import * as fhir from "fhir/r4"
import {
  Dose,
  DoseRange,
  DoseSimpleQuantity,
  Rate,
  RateRange,
  RateRatio,
  RateSimpleQuantity
} from "../../../../../models/fhir"

export function isOperationOutcome(resource: fhir.FhirResource): resource is fhir.OperationOutcome {
  return resource.resourceType === "OperationOutcome"
}

export function isBundle(resource: fhir.FhirResource): resource is fhir.Bundle {
  return resource.resourceType === "Bundle"
}

export function isClaim(resource: fhir.FhirResource): resource is fhir.Claim {
  return resource.resourceType === "Claim"
}

export function isTask(resource: fhir.FhirResource): resource is fhir.Task {
  return resource.resourceType === "Task"
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

export function getArrayTypeGuard<T>(
  arrayElementTypeGuard: (arrayElement: unknown) => arrayElement is T
): (maybeArray: unknown) => maybeArray is Array<T> {
  return function (maybeArray: unknown): maybeArray is Array<T> {
    return Array.isArray(maybeArray) && maybeArray.every(arrayElementTypeGuard)
  }
}
