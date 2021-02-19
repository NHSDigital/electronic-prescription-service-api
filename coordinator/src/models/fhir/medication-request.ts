import * as fhir from "./fhir-resources"
import {createCodeableConcept} from "../../services/translation/response/fhir-base-types"

export enum CourseOfTherapyTypeCode {
  ACUTE = "acute",
  CONTINUOUS = "continuous",
  CONTINUOUS_REPEAT_DISPENSING = "continuous-repeat-dispensing"
}

export const CourseOfTherapyType = Object.freeze({
  ACUTE: createCodeableConcept(
    "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
    CourseOfTherapyTypeCode.ACUTE,
    "Short course (acute) therapy"
  ),
  CONTINUOUS: createCodeableConcept(
    "http://terminology.hl7.org/CodeSystem/medicationrequest-course-of-therapy",
    CourseOfTherapyTypeCode.CONTINUOUS,
    "Continuous long term therapy"
  ),
  CONTINOUS_REPEAT_DISPENSING: createCodeableConcept(
    "https://fhir.nhs.uk/CodeSystem/medicationrequest-course-of-therapy",
    CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING,
    "Continuous long term (repeat dispensing)"
  )
})

export enum MedicationRequestStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  STOPPED = "stopped",
  UNKNOWN = "unknown"
}

export interface BaseMedicationRequest extends fhir.Resource {
  resourceType: "MedicationRequest"
  extension: Array<fhir.Extension>
  identifier: Array<fhir.Identifier>
  status: MedicationRequestStatus
  intent: string
  medicationCodeableConcept: fhir.CodeableConcept
  subject: fhir.Reference<fhir.Patient>
  authoredOn: string
  requester: fhir.Reference<fhir.PractitionerRole>
  groupIdentifier: MedicationRequestGroupIdentifier
  dispenseRequest?: MedicationRequestDispenseRequest
  substitution?: {
    allowedBoolean: false
  }
}

export interface MedicationRequest extends BaseMedicationRequest {
  category?: Array<fhir.CodeableConcept>
  courseOfTherapyType: fhir.CodeableConcept
  dosageInstruction: Array<Dosage>
  extension: Array<MedicationRequestPermittedExtensions>
  statusReason?: fhir.CodeableConcept
  dispenseRequest: MedicationRequestDispenseRequest
}

export interface MedicationRequestOutcome extends BaseMedicationRequest {
  extension: Array<fhir.ReferenceExtension<fhir.PractitionerRole> | PrescriptionStatusHistoryExtension>
}

//TODO - at what point do we just use Extension instead of a union type? What benefit is this providing?
export type MedicationRequestPermittedExtensions = fhir.IdentifierExtension
  | fhir.ReferenceExtension<fhir.PractitionerRole> | fhir.CodingExtension | fhir.CodeableConceptExtension
  | RepeatInformationExtension | ControlledDrugExtension

export type RepeatInformationExtension = fhir.ExtensionExtension<fhir.UnsignedIntExtension | fhir.DateTimeExtension>
export type ControlledDrugExtension = fhir.ExtensionExtension<fhir.StringExtension | fhir.CodingExtension>
export type PrescriptionStatusHistoryExtension = fhir.ExtensionExtension<fhir.CodingExtension>

export interface MedicationRequestGroupIdentifier extends fhir.Identifier {
  extension?: Array<fhir.IdentifierExtension>
}

export interface Dosage {
  text: string
  patientInstruction?: string
  additionalInstruction?: Array<fhir.CodeableConcept>
}

export interface Performer extends fhir.IdentifierReference<fhir.Organization> {
  extension?: Array<fhir.ReferenceExtension<fhir.PractitionerRole>>
}

export interface MedicationRequestDispenseRequest {
  extension?: Array<fhir.CodingExtension | fhir.StringExtension | fhir.ReferenceExtension<fhir.PractitionerRole>>
  identifier?: fhir.Identifier
  quantity?: fhir.SimpleQuantity
  expectedSupplyDuration?: fhir.SimpleQuantity
  performer?: Performer
  validityPeriod?: fhir.Period
}
