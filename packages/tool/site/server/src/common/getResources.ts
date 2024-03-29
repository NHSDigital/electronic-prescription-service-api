import {Bundle, MedicationRequest, Resource} from "fhir/r4"

export function getMedicationRequests(bundle: Bundle): Array<MedicationRequest> {
  return getResourcesOfType(bundle, "MedicationRequest")
}

export function getResourcesOfType<T extends Resource>(bundle: Bundle, resourceType: string): Array<T> {
  return bundle.entry
    ? bundle.entry
      .map(entry => entry.resource)
      .filter(resource => resource?.resourceType === resourceType) as Array<T>
    : []
}
