import * as common from "./common"
import * as practitionerRole from "./practitioner-role"
import * as patient from "./patient"
import * as extension from "./extension"

export enum CourseOfTherapyTypeCode {
  ACUTE = "acute",
  CONTINUOUS = "continuous",
  CONTINUOUS_REPEAT_DISPENSING = "continuous-repeat-dispensing"
}

export const COURSE_OF_THERAPY_TYPE_ACUTE = common.createCodeableConcept(
  "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
  CourseOfTherapyTypeCode.ACUTE,
  "Short course (acute) therapy"
)

export const COURSE_OF_THERAPY_TYPE_CONTINUOUS = common.createCodeableConcept(
  "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
  CourseOfTherapyTypeCode.CONTINUOUS,
  "Continuous long term therapy"
)

export const COURSE_OF_THERAPY_TYPE_CONTINUOUS_REPEAT_DISPENSING = common.createCodeableConcept(
  "https://fhir.nhs.uk/CodeSystem/medicationrequest-course-of-therapy",
  CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING,
  "Continuous long term (repeat dispensing)"
)

export enum MedicationRequestStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  STOPPED = "stopped",
  UNKNOWN = "unknown"
}

export enum MedicationRequestIntent {
  ORDER = "order",
  PLAN = "plan"
}

export interface BaseMedicationRequest extends common.Resource {
  resourceType: "MedicationRequest"
  extension: Array<extension.Extension>
  identifier: Array<common.Identifier>
  status: MedicationRequestStatus
  intent: MedicationRequestIntent
  medicationCodeableConcept: common.CodeableConcept
  subject: common.Reference<patient.Patient>
  authoredOn: string
  requester: common.Reference<practitionerRole.PractitionerRole>
  groupIdentifier: MedicationRequestGroupIdentifier
  dispenseRequest?: MedicationRequestDispenseRequest
  substitution?: {
    allowedBoolean: false
  }
}

export interface MedicationRequest extends BaseMedicationRequest {
  category?: Array<common.CodeableConcept>
  courseOfTherapyType: common.CodeableConcept
  dosageInstruction: Array<Dosage>
  extension: Array<MedicationRequestPermittedExtensions>
  statusReason?: common.CodeableConcept
  dispenseRequest: MedicationRequestDispenseRequest
}

export interface MedicationRequestOutcome extends BaseMedicationRequest {
  extension: Array<extension.ReferenceExtension<practitionerRole.PractitionerRole> | PrescriptionStatusHistoryExtension>
}

//TODO - at what point do we just use Extension instead of a union type? What benefit is this providing?
export type MedicationRequestPermittedExtensions = extension.IdentifierExtension
  | extension.ReferenceExtension<practitionerRole.PractitionerRole>
  | extension.CodingExtension | extension.CodeableConceptExtension
  | RepeatInformationExtension | ControlledDrugExtension

export type RepeatInformationExtension = extension.ExtensionExtension<extension.UnsignedIntExtension
  | extension.DateTimeExtension>
export type ControlledDrugExtension = extension.ExtensionExtension<extension.StringExtension
  | extension.CodingExtension>
export type PrescriptionStatusHistoryExtension = extension.ExtensionExtension<extension.CodingExtension
  | extension.DateTimeExtension>

export interface MedicationRequestGroupIdentifier extends common.Identifier {
  extension?: Array<extension.IdentifierExtension>
}

export interface Dosage {
  text: string
  patientInstruction?: string
  additionalInstruction?: Array<common.CodeableConcept>
}

export interface Performer extends common.IdentifierReference<practitionerRole.Organization> {
  extension?: Array<extension.ReferenceExtension<practitionerRole.PractitionerRole>>
}

export interface MedicationRequestDispenseRequest {
  extension?: Array<extension.CodingExtension
    | extension.StringExtension
    | extension.ReferenceExtension<practitionerRole.PractitionerRole>>
  identifier?: common.Identifier
  quantity?: common.SimpleQuantity
  expectedSupplyDuration?: common.SimpleQuantity
  performer?: Performer
  validityPeriod?: common.Period
}
