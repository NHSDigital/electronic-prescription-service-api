import {CodeableConcept, Coding, Extension, Identifier, Reference} from "fhir/r4"

function getExtensions<T extends Extension>(extensions: Array<Extension>, urls: Array<string>): Array<T> {
  const nextUrl = urls.shift()
  const extensionsForUrl = extensions.filter(extension => extension.url === nextUrl)
  if (!urls.length) {
    return extensionsForUrl as Array<T>
  }
  const nestedExtensions = extensionsForUrl.flatMap(extension => extension?.extension || [])
  return getExtensions(nestedExtensions, urls)
}

function getSingleExtension<T extends Extension>(extensions: Array<Extension>, urls: Array<string>): T {
  const foundExtensions = getExtensions<T>(extensions, urls)
  if (foundExtensions.length === 1) {
    return foundExtensions[0]
  }
  throw new Error(`Found ${foundExtensions.length} when expecting only 1. Extensions: \n${extensions}\n Urls: \n${urls}`)
}

export const URL_TASK_BUSINESS_STATUS = "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-TaskBusinessStatus"

export interface TaskBusinessStatusExtension extends Extension {
  url: typeof URL_TASK_BUSINESS_STATUS,
  valueCoding: Coding
}

export const getTaskBusinessStatusExtension = (extensions: Array<Extension>): TaskBusinessStatusExtension =>
  getSingleExtension(extensions, [URL_TASK_BUSINESS_STATUS])

export const URL_GROUP_IDENTIFIER_EXTENSION = "https://fhir.nhs.uk/StructureDefinition/Extension-DM-GroupIdentifier"

export interface GroupIdentifierExtension extends Extension {
  url: typeof URL_GROUP_IDENTIFIER_EXTENSION,
  extension: Array<PrescriptionShortFormIdExtension | PrescriptionLongFormIdExtension>
}

interface PrescriptionShortFormIdExtension extends Extension {
  url: "shortForm",
  valueIdentifier: Identifier
}

interface PrescriptionLongFormIdExtension extends Extension {
  url: "UUID",
  valueIdentifier: Identifier
}

export const getGroupIdentifierExtension = (extensions: Array<Extension>): GroupIdentifierExtension =>
  getSingleExtension(extensions, [URL_GROUP_IDENTIFIER_EXTENSION])

export const URL_CLAIM_SEQUENCE_IDENTIFIER = "https://fhir.nhs.uk/StructureDefinition/Extension-ClaimSequenceIdentifier"

export interface ClaimSequenceIdentifierExtension extends Extension {
  url: typeof URL_CLAIM_SEQUENCE_IDENTIFIER,
  valueIdentifier: Identifier
}

export const getClaimSequenceIdentifierExtension = (extensions: Array<Extension>): ClaimSequenceIdentifierExtension =>
  getSingleExtension(extensions, [URL_CLAIM_SEQUENCE_IDENTIFIER])

export const URL_CLAIM_MEDICATION_REQUEST_REFERENCE = "https://fhir.nhs.uk/StructureDefinition/Extension-ClaimMedicationRequestReference"

export interface ClaimMedicationRequestReferenceExtension extends Extension {
  url: typeof URL_CLAIM_MEDICATION_REQUEST_REFERENCE,
  valueReference: Reference
}

export const getClaimMedicationRequestReferenceExtension = (extensions: Array<Extension>): ClaimMedicationRequestReferenceExtension =>
  getSingleExtension(extensions, [URL_CLAIM_MEDICATION_REQUEST_REFERENCE])

const URL_REPEAT_INFORMATION = "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation"
export const URL_NUMBER_OF_REPEATS_ISSUED = "numberOfRepeatsIssued"
export const URL_NUMBER_OF_REPEATS_ALLOWED = "numberOfRepeatsAllowed"

export interface RepeatInformationExtension extends Extension {
  url: typeof URL_REPEAT_INFORMATION
  extension: Array<NumberOfRepeatsIssuedExtension | NumberOfRepeatsAllowedExtension>
}

interface NumberOfRepeatsIssuedExtension extends Extension {
  url: typeof URL_NUMBER_OF_REPEATS_ISSUED
  valueInteger: number
}

export interface NumberOfRepeatsAllowedExtension extends Extension {
  url: typeof URL_NUMBER_OF_REPEATS_ALLOWED
  valueInteger: number
}

export const getNumberOfRepeatsIssuedExtension = (extensions: Array<Extension>): NumberOfRepeatsIssuedExtension =>
  getSingleExtension(extensions, [
    URL_REPEAT_INFORMATION,
    URL_NUMBER_OF_REPEATS_ISSUED
  ])
export const getNumberOfRepeatsAllowedExtension = (extensions: Array<Extension>): NumberOfRepeatsAllowedExtension =>
  getSingleExtension(extensions, [
    URL_REPEAT_INFORMATION,
    URL_NUMBER_OF_REPEATS_ALLOWED
  ])

const URL_UK_CORE_REPEAT_INFORMATION = "https://fhir.hl7.org.uk/StructureDefinition/Extension-UKCore-MedicationRepeatInformation"
export const URL_UK_CORE_NUMBER_OF_REPEATS_ISSUED = "numberOfPrescriptionsIssued"
export const URL_UK_CORE_AUTHORISATION_EXPIRY_DATE = "authorisationExpiryDate"

export interface UkCoreNumberOfRepeatPrescriptionsIssuedExtension extends Extension {
  url: typeof URL_UK_CORE_NUMBER_OF_REPEATS_ISSUED
  valueUnsignedInt: number
}

export interface UkCoreAuthorisationExpiryDateExtension extends Extension {
  url: typeof URL_UK_CORE_AUTHORISATION_EXPIRY_DATE
  valueDateTime: string
}

export const getUkCoreNumberOfRepeatsIssuedExtension = (extensions: Array<Extension>): UkCoreNumberOfRepeatPrescriptionsIssuedExtension =>
  getExtensions(extensions, [
    URL_UK_CORE_REPEAT_INFORMATION,
    URL_UK_CORE_NUMBER_OF_REPEATS_ISSUED
  ])[0] as UkCoreNumberOfRepeatPrescriptionsIssuedExtension

const URL_PRESCRIPTION_EXTENSION = "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-Prescription"
const URL_PRESCRIPTION_EXTENSION_COURSE_OF_THERAPY_EXTENSION = "courseOfTherapyType"

interface CourseOfTherapyTypeExtension extends Extension {
  url: typeof URL_PRESCRIPTION_EXTENSION_COURSE_OF_THERAPY_EXTENSION,
  valueCoding: Coding
}

export const getCourseOfTherapyTypeExtension = (extensions: Array<Extension>): CourseOfTherapyTypeExtension =>
  getSingleExtension(extensions, [
    URL_PRESCRIPTION_EXTENSION,
    URL_PRESCRIPTION_EXTENSION_COURSE_OF_THERAPY_EXTENSION
  ])

export const URL_PERFORMER_SITE_TYPE = "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType"

export interface PerformerSiteTypeExtension extends Extension {
  url: typeof URL_PERFORMER_SITE_TYPE
  valueCoding: Coding
}

export const getPerformerSiteTypeExtension = (extensions: Array<Extension>): PerformerSiteTypeExtension =>
  getSingleExtension(extensions, [URL_PERFORMER_SITE_TYPE])

export const URL_PRESCRIPTION_ENDORSEMENT = "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement"

export interface PrescriptionEndorsementExtension extends Extension {
  url: typeof URL_PRESCRIPTION_ENDORSEMENT
  valueCodeableConcept: CodeableConcept
}

export const getPrescriptionEndorsementExtensions = (extensions: Array<Extension>): Array<PrescriptionEndorsementExtension> =>
  getExtensions(extensions, [URL_PRESCRIPTION_ENDORSEMENT])

const URL_DISPENSING_INFORMATION_EXTENSION = "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-DispensingInformation"
const URL_DISPENSING_INFORMATION_DISPENSE_STATUS_EXTENSION = "dispenseStatus"

interface DispenseStatusExtension extends Extension {
  url: typeof URL_DISPENSING_INFORMATION_DISPENSE_STATUS_EXTENSION,
  valueCoding: Coding
}

export const getDispenseStatusExtension = (extensions: Array<Extension>): DispenseStatusExtension =>
  getSingleExtension(extensions, [
    URL_DISPENSING_INFORMATION_EXTENSION,
    URL_DISPENSING_INFORMATION_DISPENSE_STATUS_EXTENSION
  ])

export const URL_LONG_FORM_ID = "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId"

export interface LongFormIdExtension extends Extension {
  url: typeof URL_LONG_FORM_ID,
  valueIdentifier: Identifier
}

export const getLongFormIdExtension = (extensions: Array<Extension>): LongFormIdExtension =>
  getSingleExtension(extensions, [URL_LONG_FORM_ID])
