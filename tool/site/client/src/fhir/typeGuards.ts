import * as fhir from "fhir/r4"

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

export function getArrayTypeGuard<T>(
  arrayElementTypeGuard: (arrayElement: unknown) => arrayElement is T
): (maybeArray: unknown) => maybeArray is Array<T> {
  return function (maybeArray: unknown): maybeArray is Array<T> {
    return Array.isArray(maybeArray) && maybeArray.every(arrayElementTypeGuard)
  }
}
