import {CodeableConcept, Coding, Extension, Identifier, Reference} from "fhir/r4"

function getExtensionFinder<T extends Extension>(url: string) {
  return (extensions: Array<Extension>) => extensions.find(extension => extension.url === url) as T
}

export const URL_TASK_BUSINESS_STATUS = "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatus"
export interface TaskBusinessStatusExtension extends Extension {
  url: typeof URL_TASK_BUSINESS_STATUS,
  valueCoding: Coding
}
export const getTaskBusinessStatusExtension = getExtensionFinder<TaskBusinessStatusExtension>(URL_TASK_BUSINESS_STATUS)

export const URL_GROUP_IDENTIFIER_EXTENSION = "https://fhir.nhs.uk/StructureDefinition/Extension-DM-GroupIdentifier"
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

export const URL_CLAIM_SEQUENCE_IDENTIFIER = "https://fhir.nhs.uk/StructureDefinition/Extension-ClaimSequenceIdentifier"
export interface ClaimSequenceIdentifierExtension extends Extension {
  url: typeof URL_CLAIM_SEQUENCE_IDENTIFIER,
  valueIdentifier: Identifier
}
export const getClaimSequenceIdentifierExtension = getExtensionFinder<ClaimSequenceIdentifierExtension>(URL_CLAIM_SEQUENCE_IDENTIFIER)

export const URL_CLAIM_MEDICATION_REQUEST_REFERENCE = "https://fhir.nhs.uk/StructureDefinition/Extension-ClaimMedicationRequestReference"
export interface ClaimMedicationRequestReferenceExtension extends Extension {
  url: typeof URL_CLAIM_MEDICATION_REQUEST_REFERENCE,
  valueReference: Reference
}
export const getClaimMedicationRequestReferenceExtension = getExtensionFinder<ClaimMedicationRequestReferenceExtension>(URL_CLAIM_MEDICATION_REQUEST_REFERENCE)

export const URL_REPEAT_INFORMATION = "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation"
export interface RepeatInformationExtension extends Extension {
  url: typeof URL_REPEAT_INFORMATION
  extension: Array<NumberOfRepeatsIssuedExtension | NumberOfRepeatsAllowedExtension>
}
export const getRepeatInformationExtension = getExtensionFinder<RepeatInformationExtension>(URL_REPEAT_INFORMATION)

export const URL_NUMBER_OF_REPEATS_ISSUED = "numberOfRepeatsIssued"
export interface NumberOfRepeatsIssuedExtension extends Extension {
  url: typeof URL_NUMBER_OF_REPEATS_ISSUED
  valueInteger: number
}
export const getNumberOfRepeatsIssuedExtension = getExtensionFinder<NumberOfRepeatsIssuedExtension>(URL_NUMBER_OF_REPEATS_ISSUED)

export const URL_NUMBER_OF_REPEATS_ALLOWED = "numberOfRepeatsAllowed"
export interface NumberOfRepeatsAllowedExtension extends Extension {
  url: typeof URL_NUMBER_OF_REPEATS_ALLOWED
  valueInteger: number
}
export const getNumberOfRepeatsAllowedExtension = getExtensionFinder<NumberOfRepeatsAllowedExtension>(URL_NUMBER_OF_REPEATS_ALLOWED)

export const URL_PERFORMER_SITE_TYPE = "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType"
export interface PerformerSiteTypeExtension extends Extension {
  url: typeof URL_PERFORMER_SITE_TYPE
  valueCoding: Coding
}
export const getPerformerSiteTypeExtension = getExtensionFinder<PerformerSiteTypeExtension>(URL_PERFORMER_SITE_TYPE)

export const URL_PRESCRIPTION_ENDORSEMENT = "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement"
export interface PrescriptionEndorsementExtension extends Extension {
  url: typeof URL_PRESCRIPTION_ENDORSEMENT
  valueCodeableConcept: CodeableConcept
}
export const getPrescriptionEndorsementExtension = getExtensionFinder<PrescriptionEndorsementExtension>(URL_PRESCRIPTION_ENDORSEMENT)
