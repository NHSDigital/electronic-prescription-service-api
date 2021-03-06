import * as extension from "./extension"
import * as common from "./common"
import * as patient from "./patient"

export interface MedicationDispense extends common.Resource {
    identifier: Array<common.Identifier>
    extension?: Array<extension.CodeableConceptExtension>
    medicationCodeableConcept: common.CodeableConcept
    subject: common.IdentifierReference<patient.Patient>
    quantity: common.SimpleQuantity
    authorizingPrescription: Array<AuthorizingPrescription>
}

export interface AuthorizingPrescription extends common.Resource {
    identifier: common.Identifier
    extension: Array<extension.Extension>
}
