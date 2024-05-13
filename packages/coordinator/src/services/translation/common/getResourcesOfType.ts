import {fhir, processingErrors} from "@models"
import {isPractitionerRole, isMedicationRequest, isOrganization} from "../../../utils/type-guards"
import {onlyElement} from "./index"

export function getResourcesOfType<T extends fhir.Resource>(bundle: fhir.Bundle, resourceType: string): Array<T> {
  return bundle.entry
    .map(entry => entry.resource)
    .filter(resource => resource.resourceType === resourceType) as Array<T>
}

export interface Pathed {
  path: string
}
export function getPathedResourcesOfType<T extends fhir.Resource & Pathed>(
  bundle: fhir.Bundle,
  resourceType: string,
): Array<T> {
  const root_path = "bundle.entry"

  return bundle.entry
    .map((entry, index) => {
      return {
        path: `${root_path}[${index}].resource`,
        ...entry.resource
      }
    })
    .filter((resource) => resource.resourceType === resourceType) as Array<T>
}

export function getBundleEntriesOfType(
  bundle: fhir.Bundle,
  resourceType: string
): Array<fhir.BundleEntry> {
  return bundle.entry.filter(entry => entry.resource.resourceType === resourceType)
}

export function getMessageHeader(bundle: fhir.Bundle): fhir.MessageHeader {
  return onlyElement(
    getResourcesOfType<fhir.MessageHeader>(bundle, "MessageHeader"),
    "Bundle.entry",
    "resource.resourceType == 'MessageHeader'"
  )
}

export function getMedicationRequests(bundle: fhir.Bundle): Array<fhir.MedicationRequest> {
  return getResourcesOfType<fhir.MedicationRequest>(bundle, "MedicationRequest")
}

export function getMedicationDispenses(bundle: fhir.Bundle): Array<fhir.MedicationDispense> {
  return getResourcesOfType<fhir.MedicationDispense>(bundle, "MedicationDispense")
}

export function getCommunicationRequests(bundle: fhir.Bundle): Array<fhir.CommunicationRequest> {
  return getResourcesOfType<fhir.CommunicationRequest>(bundle, "CommunicationRequest")
}

export function getLists(bundle: fhir.Bundle): Array<fhir.List> {
  return getResourcesOfType<fhir.List>(bundle, "List")
}

export function getPatient(bundle: fhir.Bundle): fhir.Patient {
  return onlyElement(
    getResourcesOfType<fhir.Patient>(bundle, "Patient"),
    "Bundle.entry",
    "resource.resourceType == 'Patient'"
  )
}

export function getPatientOrNull(bundle: fhir.Bundle): fhir.Patient {
  const patients = getResourcesOfType<fhir.Patient>(bundle, "Patient")
  if (patients.length === 1) {
    return patients[0]
  }
  return null
}

export function getOrganizations(bundle: fhir.Bundle): Array<fhir.Organization> {
  return getResourcesOfType<fhir.Organization>(bundle, "Organization")
}

export function getPractitioners(bundle: fhir.Bundle): Array<fhir.Practitioner> {
  return getResourcesOfType<fhir.Practitioner>(bundle, "Practitioner")
}

export function getPractitionerRoles(bundle: fhir.Bundle): Array<fhir.PractitionerRole> {
  return getResourcesOfType<fhir.PractitionerRole>(bundle, "PractitionerRole")
}

export function getProvenances(bundle: fhir.Bundle): Array<fhir.Provenance> {
  return getResourcesOfType<fhir.Provenance>(bundle, "Provenance")
}

export function getHealthcareServices(bundle: fhir.Bundle): Array<fhir.HealthcareService> {
  return getResourcesOfType<fhir.HealthcareService>(bundle, "HealthcareService")
}

export function getLocations(bundle: fhir.Bundle): Array<fhir.Location> {
  return getResourcesOfType<fhir.Location>(bundle, "Location")
}

function resolveContainedReference<P extends fhir.Resource, C extends fhir.Resource>(
  parentResource: P,
  referenceValue: string,
  expectedType: string,
  resourceTypeGuard: (body: unknown) => body is C
): C {
  const containedId = referenceValue.replace("#", "")
  const containedResource = parentResource.contained.find(resource => resource.id === containedId)

  if (!containedResource) {
    throw new processingErrors.InvalidValueError(
      `Contained resource with reference ${referenceValue} not found`
    )
  }

  if (!resourceTypeGuard(containedResource)) {
    throw new processingErrors.InvalidValueError(
      `Contained resource with reference ${referenceValue} is not of type ${expectedType}`
    )
  }

  return containedResource
}

export function getContainedMedicationRequestViaReference<R extends fhir.Resource>(
  resourceWithContainedMedicationRequest: R,
  medicationRequestReference: string
): fhir.MedicationRequest {
  return resolveContainedReference(
    resourceWithContainedMedicationRequest,
    medicationRequestReference,
    "MedicationRequest",
    isMedicationRequest
  )
}

export function getContainedPractitionerRoleViaReference<R extends fhir.Resource>(
  resourceWithContainedPractitionerRole: R,
  practitionerRoleReference: string
): fhir.PractitionerRole {
  return resolveContainedReference(
    resourceWithContainedPractitionerRole,
    practitionerRoleReference,
    "PractitionerRole",
    isPractitionerRole
  )
}

export function getContainedOrganizationViaReference<R extends fhir.Resource>(
  resourceWithContainedOrganization: R,
  organizationReference: string
): fhir.Organization {
  return resolveContainedReference(
    resourceWithContainedOrganization,
    organizationReference,
    "Organization",
    isOrganization
  )
}

export type PathedTelecom = fhir.ContactPoint & Pathed;
export function getPathedTelecoms(
  bundle: fhir.Bundle,
): Array<PathedTelecom> {
  type ResourceToValidate = fhir.Organization | fhir.Practitioner | fhir.PractitionerRole;

  const get_telecom = (resource: ResourceToValidate & Pathed) => {
    return (resource.telecom ?? []).map((telecom, index) => {
      return {
        path: `${resource.path}.telecom[${index}]`,
        ...telecom
      }
    })
  }

  const organizations = getPathedResourcesOfType(bundle, "Organization")
  const practitioners = getPathedResourcesOfType(bundle, "Practitioner")
  const practitionerRoles = getPathedResourcesOfType(bundle, "PractitionerRole")

  return organizations
    .concat(practitioners)
    .concat(practitionerRoles)
    .flatMap(get_telecom)
}
