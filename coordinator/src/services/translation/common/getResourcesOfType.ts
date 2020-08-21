import * as fhir from "../../../model/fhir-resources"
import {onlyElement} from "."

function getResourcesOfType<T extends fhir.Resource>(fhirBundle: fhir.Bundle, resourceType: string): Array<T> {
  return fhirBundle.entry
    .map(entry => entry.resource)
    .filter(resource => resource.resourceType === resourceType) as Array<T>
}

export function getMedicationRequests(fhirBundle: fhir.Bundle): Array<fhir.MedicationRequest> {
  return getResourcesOfType<fhir.MedicationRequest>(fhirBundle, "MedicationRequest")
}

export function getPatient(fhirBundle: fhir.Bundle): fhir.Patient {
  return getResourcesOfType<fhir.Patient>(fhirBundle, "Patient").reduce(onlyElement)
}

export function getOrganizations(fhirBundle: fhir.Bundle): Array<fhir.Organization> {
  return getResourcesOfType<fhir.Organization>(fhirBundle, "Organization")
}

export function getProvenances(fhirBundle: fhir.Bundle): Array<fhir.Provenance> {
  return getResourcesOfType<fhir.Provenance>(fhirBundle, "Provenance")
}
