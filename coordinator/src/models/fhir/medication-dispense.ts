import * as extension from "./extension"
import * as common from "./common"
import * as patient from "./patient"
import * as medicationRequest from "./medication-request"
import {Organization,Practitioner,PractitionerRole} from "./practitioner-role"

export interface MedicationDispense extends common.Resource {
    identifier: Array<common.Identifier>
    extension?: Array<extension.CodingExtension>
    medicationCodeableConcept: common.CodeableConcept
    subject: common.IdentifierReference<patient.Patient>
    quantity: common.SimpleQuantity
    authorizingPrescription: Array<AuthorizingPrescription>
    whenPrepared: string
    dosageInstruction: Array<DosageInstruction>
    performer: Array<DispensePerformer>
    type: common.CodeableConcept
}

export interface AuthorizingPrescription extends common.IdentifierReference<medicationRequest.MedicationRequest> {
    extension: Array<extension.Extension>
}

export interface DosageInstruction {
    text: string
}

export interface DispensePerformer {
    actor: Actor
}

export interface Actor extends common.IdentifierReference<Practitioner|PractitionerRole|Organization> {
    type: "Practitioner" | "Organization"
}
