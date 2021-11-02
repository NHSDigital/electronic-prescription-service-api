import {Coding, Extension, Identifier, Reference} from "fhir/r4"

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

export const URL_UK_CORE_REPEAT_INFORMATION = "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation"
export interface UkCoreRepeatInformationExtension extends Extension {
  url: typeof URL_UK_CORE_REPEAT_INFORMATION,
  extension: Array<UkCoreNumberOfRepeatPrescriptionsIssuedExtension | UkCoreNumberOfRepeatPrescriptionsAllowedExtension | UkCoreAuthorisationExpiryDateExtension>
}
export const getUkCoreRepeatInformationExtension = getExtensionFinder<UkCoreRepeatInformationExtension>(URL_UK_CORE_REPEAT_INFORMATION)

export interface UkCoreNumberOfRepeatPrescriptionsIssuedExtension extends Extension {
  url: "numberOfRepeatPrescriptionsIssued"
  valueUnsignedInt: number
}

export interface UkCoreNumberOfRepeatPrescriptionsAllowedExtension extends Extension {
  url: "numberOfRepeatPrescriptionsAllowed"
  valueUnsignedInt: number
}

export interface UkCoreAuthorisationExpiryDateExtension extends Extension {
  url: "authorisationExpiryDate"
  valueDateTime: string
}

export const URL_REPEAT_INFORMATION = "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation"
export interface RepeatInformationExtension extends Extension {
  url: typeof URL_REPEAT_INFORMATION
  extension: Array<NumberOfRepeatsIssuedExtension | NumberOfRepeatsAllowedExtension>
}
export const getRepeatInformationExtension = getExtensionFinder<RepeatInformationExtension>(URL_REPEAT_INFORMATION)

export interface NumberOfRepeatsIssuedExtension extends Extension {
  url: "numberOfRepeatsIssued"
  valueInteger: number
}

export interface NumberOfRepeatsAllowedExtension extends Extension {
  url: "numberOfRepeatsAllowed"
  valueInteger: number
}

export const URL_LONG_FORM_ID = "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId"
export interface LongFormIdExtension extends Extension {
  url: typeof URL_LONG_FORM_ID,
  valueIdentifier: Identifier
}
export const getLongFormIdExtension = getExtensionFinder<LongFormIdExtension>(URL_LONG_FORM_ID)
