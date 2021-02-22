import {CodeableConcept, Identifier} from "../models/fhir/common"
import {
  MedicationRequest,
  MedicationRequestDispenseRequest,
  MedicationRequestGroupIdentifier,
  MedicationRequestStatus
} from "../models/fhir/medication-request"
import {CodingExtension, IdentifierExtension} from "../models/fhir/extension"

const performerSiteTypeExtension: CodingExtension = {
  url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PerformerSiteType",
  valueCoding: {
    system: "https://fhir.nhs.uk/CodeSystem/dispensing-site-preference",
    code: "0004"
  }
}

const epsPrescriptionTypeExtension: CodingExtension =  {
  url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionType",
  valueCoding: {
    system: "https://fhir.nhs.uk/CodeSystem/prescription-type",
    code: "0101"
  }
}

const prescriptionIdExtension: IdentifierExtension =  {
  url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId",
  valueIdentifier: {
    system: "https://fhir.nhs.uk/Id/prescription",
    value: "a7b86f8d-1d02-fc28-e050-d20ae3a215f0"
  }
}

const medicationRequestDispenseRequest: MedicationRequestDispenseRequest = {
  extension: [performerSiteTypeExtension],
  quantity: {code: "SNOMED_CODE", unit: "", value: ""},
  performer: undefined
}

const medicationRequestGroupIdentifier: MedicationRequestGroupIdentifier = {
  extension: [prescriptionIdExtension],
  system: "https://fhir.nhs.uk/Id/prescription-order-number",
  value: ""
}

const medicationRequestCourseOfTherapyTypeContinuousRepeatDispensing: CodeableConcept = {
  coding: [
    {
      system: "https://fhir.nhs.uk/CodeSystem/medicationrequest-course-of-therapy",
      code: "continuous-repeat-dispensing"
    }
  ]
}

const medicationRequestIdentifier: Identifier = {
  system: "https://fhir.nhs.uk/Id/prescription-order-item-number",
  value: ""
}

export const medicationRequest: MedicationRequest = {
  resourceType: "MedicationRequest",
  status: MedicationRequestStatus.ACTIVE,
  intent: "order",
  authoredOn: "2020-01-01T12:00:00+00:00",
  courseOfTherapyType: medicationRequestCourseOfTherapyTypeContinuousRepeatDispensing,
  dispenseRequest: medicationRequestDispenseRequest,
  dosageInstruction: [{text: ""}],
  extension: [epsPrescriptionTypeExtension],
  groupIdentifier: medicationRequestGroupIdentifier,
  identifier: [medicationRequestIdentifier],
  medicationCodeableConcept: {coding: [{system: "http://snomed.info/sct", code: "SNOMED_CODE"}]},
  requester: {reference: ""},
  subject: undefined
}
