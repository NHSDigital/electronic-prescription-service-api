import * as extension from "./extension"
import * as common from "./common"
import * as medicationRequest from "./medication-request"
import * as medication from "./medication"
import * as patient from "./patient"
import * as practitionerRole from "./practitioner-role"

export interface MedicationDispense extends common.Resource {
  resourceType: "MedicationDispense"
  identifier: Array<common.Identifier>
  extension?: Array<extension.Extension | extension.CodingExtension>
  medicationCodeableConcept?: common.CodeableConcept
  medicationReference?: common.Reference<medication.Medication>
  subject: common.IdentifierReference<patient.Patient>
  quantity: common.SimpleQuantity
  authorizingPrescription: Array<AuthorizingPrescription>
  whenPrepared: string
  dosageInstruction: Array<medicationRequest.Dosage>
  performer: Array<DispensePerformer>
  type: common.CodeableConcept,
  status: DispenseStatus
}

export type DispenseStatus = "preparation" | "in-progress" | "cancelled" | "on-hold" | "completed" | "entered-in-error" | "stopped" | "declined" | "unknown"

export interface AuthorizingPrescription extends common.IdentifierReference<medicationRequest.MedicationRequest> {
  extension: Array<AuthorizingPrescriptionExtension>
}

export type AuthorizingPrescriptionExtension = extension.ExtensionExtension<extension.IdentifierExtension>

export interface DispensePerformer {
  actor: Actor
}

export interface Actor extends common.IdentifierReference<practitionerRole.PersonOrOrganization> {
  type: "Practitioner" | "PractitionerRole" | "Organization"
}
