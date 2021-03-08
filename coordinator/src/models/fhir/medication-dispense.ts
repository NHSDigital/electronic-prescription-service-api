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

export interface AuthorizingPrescription extends common.Resource {
    identifier: common.Identifier
    extension: Array<extension.Extension>
}

export interface DosageInstruction extends common.Resource {
    text: string
}

export interface DispensePerformer extends common.Resource {
    actor: Actor
}

export interface Actor extends common.Resource {
    type: "Practitioner" | "Organization"
    identifier: common.Identifier
    display: string
}
