import * as extension from "./extension"
import * as common from "./common"
import * as patient from "./patient"

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

export interface AuthorizingPrescription {
    identifier: common.Identifier
    extension: Array<extension.Extension>
}

export interface DosageInstruction {
    text: string
}

export interface DispensePerformer {
    actor: Actor
}

export interface Actor {
    type: "Practitioner" | "Organization"
    identifier: common.Identifier
    display: string
}
