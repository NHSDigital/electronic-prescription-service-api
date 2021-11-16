import {Bundle, FhirResource, OperationOutcome, Task} from "fhir/r4"

export function isOperationOutcome(resource: FhirResource): resource is OperationOutcome {
  return resource.resourceType === "OperationOutcome"
}

export function isBundle(resource: FhirResource): resource is Bundle {
  return resource.resourceType === "Bundle"
}

export function isTask(resource: FhirResource): resource is Task {
  return resource.resourceType === "Task"
}
