import * as extension from "./extension"
import * as common from "./common"
import * as patient from "./patient"
import * as medicationRequest from "./medication-request"
import * as practitionerRole from "./practitioner-role"
import * as medication from "./medication"

export interface MedicationDispense extends common.Resource {
  resourceType: "MedicationDispense"
  contained: Array<medicationRequest.MedicationRequest | practitionerRole.PractitionerRole>
  identifier: Array<common.Identifier>
  extension?: Array<extension.CodingExtension | extension.ExtensionExtension<extension.IntegerExtension>>
  medicationCodeableConcept?: common.CodeableConcept
  medicationReference?: common.Reference<medication.Medication>
  subject: common.IdentifierReference<patient.Patient>
  quantity: common.SimpleQuantity
  authorizingPrescription: Array<common.Reference<medicationRequest.MedicationRequest>>
  whenHandedOver: string
  dosageInstruction: Array<medicationRequest.Dosage>
  performer: Array<DispensePerformer>
  type: common.CodeableConcept
  statusReasonCodeableConcept: common.CodeableConcept
}

export interface DispensePerformer {
  actor: common.Reference<practitionerRole.PractitionerRole>
}
