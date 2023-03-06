import * as common from "./common"
import * as practitionerRole from "./practitioner-role"
import * as patient from "./patient"
import * as medication from "./medication"
import * as extension from "./extension"
import {LosslessNumber} from "lossless-json"

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
  PLAN = "plan",
  REFLEX_ORDER = "reflex-order",
  ORIGINAL_ORDER = "original-order",
  INSTANCE_ORDER = "instance-order"
}

export interface BaseMedicationRequest extends common.Resource {
  resourceType: "MedicationRequest"
  extension: Array<extension.Extension>
  identifier: Array<common.Identifier>
  status: MedicationRequestStatus
  intent: MedicationRequestIntent
  medicationCodeableConcept?: common.CodeableConcept
  medicationReference?: common.Reference<medication.Medication>
  subject: common.Reference<patient.Patient>
  authoredOn: string
  requester: common.Reference<practitionerRole.PractitionerRole>
  groupIdentifier: MedicationRequestGroupIdentifier
  note?: Array<Annotation>
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
  basedOn?: Array<MedicationRequestBasedOn>
}

export interface MedicationRequestOutcome extends BaseMedicationRequest {
  extension: Array<extension.ReferenceExtension<practitionerRole.PractitionerRole>
    | extension.PrescriptionStatusHistoryExtension>
}

//TODO - at what point do we just use Extension instead of a union type? What benefit is this providing?
export type MedicationRequestPermittedExtensions = extension.IdentifierExtension
  | extension.ReferenceExtension<practitionerRole.PractitionerRole>
  | extension.CodingExtension | extension.CodeableConceptExtension
  | extension.UkCoreRepeatInformationExtension | extension.ControlledDrugExtension
  | extension.DispensingInformationExtension

export interface MedicationRequestGroupIdentifier extends common.Identifier {
  extension?: Array<extension.IdentifierExtension>
}

export type Dosage = {
  sequence?: string | LosslessNumber
  text?: string
  additionalInstruction?: Array<common.CodeableConcept>
  patientInstruction?: string
  timing?: Timing
  site?: common.CodeableConcept
  route?: common.CodeableConcept
  method?: common.CodeableConcept
  doseAndRate?: Array<DoseAndRate>
  maxDosePerPeriod?: common.Ratio
  maxDosePerAdministration?: common.SimpleQuantity
  maxDosePerLifetime?: common.SimpleQuantity
} & AsNeeded

export type AsNeeded = {
  asNeededBoolean?: boolean
  asNeededCodeableConcept?: never
} | {
  asNeededBoolean?: never
  asNeededCodeableConcept?: common.CodeableConcept
}

export type Dose = DoseRange | DoseSimpleQuantity

export type Rate = RateRange | RateRatio | RateSimpleQuantity

export type DoseAndRate = {
  type?: common.CodeableConcept
} & Dose & Rate

export interface Timing {
  event?: Array<string>
  repeat?: Repeat
  code?: common.CodeableConcept
}

export type Repeat = {
  count?: string | LosslessNumber
  countMax?: string | LosslessNumber
  duration?: string | LosslessNumber
  durationMax?: string | LosslessNumber
  durationUnit?: UnitOfTime
  frequency?: string | LosslessNumber
  frequencyMax?: string | LosslessNumber
  period?: string | LosslessNumber
  periodMax?: string | LosslessNumber
  periodUnit?: UnitOfTime
  dayOfWeek?: Array<DayOfWeek>
  timeOfDay?: Array<string>
  when?: Array<EventTiming>
  offset?: string | LosslessNumber
} & Bounds

export type Bounds = {
  boundsDuration?: common.Duration
  boundsRange?: never
  boundsPeriod?: never
} | {
  boundsDuration?: never
  boundsRange?: common.Range
  boundsPeriod?: never
} | {
  boundsDuration?: never
  boundsRange?: never
  boundsPeriod?: common.Period
}

export enum UnitOfTime {
  SECOND = "s",
  MINUTE = "min",
  HOUR = "h",
  DAY = "d",
  WEEK = "wk",
  MONTH = "mo",
  YEAR = "a"
}

export enum EventTiming {
  MORNING = "MORN",
  EARLY_MORNING = "MORN.early",
  LATE_MORNING = "MORN.late",
  NOON = "NOON",
  AFTERNOON = "AFT",
  EARLY_AFTERNOON = "AFT.early",
  LATE_AFTERNOON = "AFT.late",
  EVENING = "EVE",
  EARLY_EVENING = "EVE.early",
  LATE_EVENING = "EVE.late",
  NIGHT = "NIGHT",
  AFTER_SLEEP = "PHS",
  BEFORE_SLEEP = "HS",
  UPON_WAKING = "WAKE",
  AT_MEAL = "C",
  AT_BREAKFAST = "CM",
  AT_LUNCH = "CD",
  AT_DINNER = "CV",
  BEFORE_MEAL = "AC",
  BEFORE_BREAKFAST = "ACM",
  BEFORE_LUNCH = "ACD",
  BEFORE_DINNER = "ACV",
  AFTER_MEAL = "PC",
  AFTER_BREAKFAST = "PCM",
  AFTER_LUNCH = "PCD",
  AFTER_DINNER = "PCV"
}

export enum DayOfWeek {
  MONDAY = "mon",
  TUESDAY = "tue",
  WEDNESDAY = "wed",
  THURSDAY = "thu",
  FRIDAY = "fri",
  SATURDAY = "sat",
  SUNDAY = "sun"
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
  numberOfRepeatsAllowed?: string | LosslessNumber
}

export interface Annotation {
  text: string
}

export interface MedicationRequestBasedOn extends common.Reference<MedicationRequest> {
  extension?: Array<extension.ExtensionExtension<extension.IntegerExtension>>
}

export type DoseSimpleQuantity = {
  doseRange?: never
  doseQuantity?: common.SimpleQuantity
}

export type DoseRange = {
  doseRange?: common.Range
  doseQuantity?: never
}

export type RateSimpleQuantity = {
  rateRatio?: never
  rateRange?: never
  rateQuantity?: common.SimpleQuantity
}

export type RateRange = {
  rateRatio?: never
  rateRange?: common.Range
  rateQuantity?: never
}

export type RateRatio = {
  rateRatio?: common.Ratio
  rateRange?: never
  rateQuantity?: never
}
