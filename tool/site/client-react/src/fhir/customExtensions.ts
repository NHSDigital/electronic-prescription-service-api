import {Coding, Extension, Identifier, Reference} from "fhir/r4"

function getExtensionFinder<T extends Extension>(url: string) {
  return (extensions: Array<Extension>) => extensions.find(extension => extension.url === url) as T
}

const URL_TASK_BUSINESS_STATUS = "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatus"
export interface TaskBusinessStatusExtension extends Extension {
  url: typeof URL_TASK_BUSINESS_STATUS,
  valueCoding: Coding
}
export const getTaskBusinessStatusExtension = getExtensionFinder<TaskBusinessStatusExtension>(URL_TASK_BUSINESS_STATUS)

const URL_GROUP_IDENTIFIER_EXTENSION = "https://fhir.nhs.uk/StructureDefinition/Extension-DM-GroupIdentifier"
export interface GroupIdentifierExtension extends Extension {
  url: typeof URL_GROUP_IDENTIFIER_EXTENSION,
  extension: Array<PrescriptionShortFormIdExtension | PrescriptionLongFormIdExtension>
}
export const getGroupIdentifierExtension = getExtensionFinder<GroupIdentifierExtension>(URL_GROUP_IDENTIFIER_EXTENSION)

export interface PrescriptionShortFormIdExtension extends Extension {
  url: "shortForm",
  valueIdentifier: Identifier
}

export interface PrescriptionLongFormIdExtension extends Extension {
  url: "UUID",
  valueIdentifier: Identifier
}

const URL_CLAIM_SEQUENCE_IDENTIFIER = "https://fhir.nhs.uk/StructureDefinition/Extension-ClaimSequenceIdentifier"
export interface ClaimSequenceIdentifierExtension {
  url: typeof URL_CLAIM_SEQUENCE_IDENTIFIER,
  valueIdentifier: Identifier
}
export const getClaimSequenceIdentifierExtension = getExtensionFinder<ClaimSequenceIdentifierExtension>(URL_CLAIM_SEQUENCE_IDENTIFIER)

const URL_CLAIM_MEDICATION_REQUEST_REFERENCE = "https://fhir.nhs.uk/StructureDefinition/Extension-ClaimMedicationRequestReference"
export interface ClaimMedicationRequestReferenceExtension {
  url: typeof URL_CLAIM_MEDICATION_REQUEST_REFERENCE,
  valueReference: Reference
}
export const getClaimMedicationRequestReferenceExtension = getExtensionFinder<ClaimMedicationRequestReferenceExtension>(URL_CLAIM_MEDICATION_REQUEST_REFERENCE)
