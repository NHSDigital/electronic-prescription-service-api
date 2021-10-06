import {
  Bundle,
  BundleEntry,
  BundleEntryGeneric,
  Patient,
  Practitioner,
  PractitionerRole,
  Organization,
  MedicationRequest,
  MessageHeader,
  CommunicationRequest, MedicationDispense
} from "../../models"
import * as fhirCommon from "../../models/common"
import * as fhirExtension from "../../models/extension"
import {getFullNameFn} from "../../ui/formatters"

export const getPatientResources = buildResourceFinder<Patient>("Patient")
export const getPractitionerResources = buildResourceFinder<Practitioner>("Practitioner")
export const getPractitionerRoleResources = buildResourceFinder<PractitionerRole>("PractitionerRole")
export const getOrganizationResources = buildResourceFinder<Organization>("Organization")
export const getMedicationRequestResources = buildResourceFinder<MedicationRequest>("MedicationRequest")
export const getMedicationDispenseResources = buildResourceFinder<MedicationDispense>("MedicationDispense")
export const getMessageHeaderResources = buildResourceFinder<MessageHeader>("MessageHeader")
export const getCommunicationRequestResources = buildResourceFinder<CommunicationRequest>("CommunicationRequest")

export const getMessageHeaderBundleEntries = buildBundleEntryFinder<MessageHeader>("MessageHeader")
export const getMedicationRequestBundleEntries = buildBundleEntryFinder<MedicationRequest>("MedicationRequest")
export const getPractitionerRoleBundleEntries = buildBundleEntryFinder<PractitionerRole>("PractitionerRole")
export const getPractitionerBundleEntries = buildBundleEntryFinder<Practitioner>("Practitioner")
export const getPatientBundleEntries = buildBundleEntryFinder<Patient>("Patient")

function buildResourceFinder<T extends fhirCommon.Resource>(resourceType: string): (payload: Bundle) => Array<T> {
  return function (payload: Bundle): Array<T> {
    const typeCheck = (resource: fhirCommon.Resource): resource is T => resource.resourceType === resourceType

    const resources = payload.entry.map(function (entry) {
      return entry.resource
    })
    return resources.filter(typeCheck)
  }
}

function buildBundleEntryFinder<T extends fhirCommon.Resource>(resourceType: string): (bundleEntries: Array<BundleEntry>) => Array<BundleEntryGeneric<T>> {
  return function getBundleEntry<T extends fhirCommon.Resource>(bundleEntries: Array<BundleEntry>): Array<BundleEntryGeneric<T>> {
    const typeCheck = (entry: BundleEntry): entry is BundleEntryGeneric<T> => entry.resource.resourceType === resourceType

    return bundleEntries.filter(typeCheck)
  }
}

export function isRepeatDispensing(bundle: Bundle): boolean {
  return getMedicationRequestResources(bundle)
    .flatMap(medicationRequest => medicationRequest.courseOfTherapyType.coding)
    .some(coding => coding.code === "continuous-repeat-dispensing")
}

export function getCanceller(cancelResponse: Bundle, success: boolean): {name: string, code: string} {
  if (!success) {
    return {
      name: null,
      code: null
    }
  }

  const medicationRequest = getMedicationRequestResources(cancelResponse)[0]
  const practitionerRoleReferenceExtension = medicationRequest.extension.filter(
    extension => extension.url === "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner"
  )
  if (!practitionerRoleReferenceExtension) {
    return getPrescriber(cancelResponse, undefined)
  }
  const practitionerRoleReference =
    (practitionerRoleReferenceExtension[0] as fhirExtension.ReferenceExtension<PractitionerRole>).valueReference.reference
  const practitionerRoleEntry = cancelResponse.entry.filter(
    e => e.fullUrl === practitionerRoleReference
  )[0]
  const practitionerRole = practitionerRoleEntry.resource as PractitionerRole
  const practitionerRoleSdsRole = practitionerRole.code
    .flatMap(code => code.coding)
    .filter(
      coding =>
        coding.system ===
        "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName"
    )[0]
  const practitionerReference = (practitionerRole.practitioner as fhirCommon.Reference<Practitioner>).reference
  const practitionerEntry = cancelResponse.entry.filter(
    e => e.fullUrl === practitionerReference
  )[0]
  const practitioner = practitionerEntry.resource as Practitioner
  const practitionerName = getPractitionerName(practitioner)
  return {
    name: practitionerName,
    code: practitionerRoleSdsRole.code
  }
}

export function getPrescriber(cancelResponse: Bundle, success: boolean): {name: string, code: string} {
  if (!success) {
    return {
      name: null,
      code: null
    }
  }
  const medicationRequest = getMedicationRequestResources(
    cancelResponse
  )[0]
  const practitionerRoleReference = medicationRequest.requester.reference
  const practitionerRoleEntry = cancelResponse.entry.filter(
    e => e.fullUrl === practitionerRoleReference
  )[0]
  const practitionerRole = practitionerRoleEntry.resource as PractitionerRole
  const practitionerRoleSdsRole = practitionerRole.code
    .flatMap(code => code.coding)
    .filter(
      coding =>
        coding.system ===
        "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName"
    )[0]
  const practitionerReference = (practitionerRole.practitioner as fhirCommon.Reference<Practitioner>).reference
  const practitionerEntry = cancelResponse.entry.filter(
    e => e.fullUrl === practitionerReference
  )[0]
  const practitioner = practitionerEntry.resource as Practitioner
  const practitionerName = getPractitionerName(practitioner)
  return {
    name: practitionerName,
    code: practitionerRoleSdsRole.code
  }
}

function getPractitionerName(practitioner: Practitioner) {
  return getFullNameFn()(practitioner.name[0])
}
