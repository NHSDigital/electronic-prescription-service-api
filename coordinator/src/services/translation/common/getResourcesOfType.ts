import * as fhir from "../../../model/fhir-resources"
import {onlyElement} from "./index"

function getResourcesOfType<T extends fhir.Resource>(fhirBundle: fhir.Bundle, resourceType: string): Array<T> {
  return fhirBundle.entry
    .map(entry => entry.resource)
    .filter(resource => resource.resourceType === resourceType) as Array<T>
}

export function getMedicationRequests(fhirBundle: fhir.Bundle): Array<fhir.MedicationRequest> {
  return getResourcesOfType<fhir.MedicationRequest>(fhirBundle, "MedicationRequest")
}

export function getCommunicationRequests(fhirBundle: fhir.Bundle): Array<fhir.CommunicationRequest> {
  return getResourcesOfType<fhir.CommunicationRequest>(fhirBundle, "CommunicationRequest")
}

export function getPatient(fhirBundle: fhir.Bundle): fhir.Patient {
  return onlyElement(
    getResourcesOfType<fhir.Patient>(fhirBundle, "Patient"),
    "Bundle.entry",
    "resource.resourceType == 'Patient'"
  )
}

export function getOrganizations(fhirBundle: fhir.Bundle): Array<fhir.Organization> {
  return getResourcesOfType<fhir.Organization>(fhirBundle, "Organization")
}

export function getProvenances(fhirBundle: fhir.Bundle): Array<fhir.Provenance> {
  return getResourcesOfType<fhir.Provenance>(fhirBundle, "Provenance")
}
