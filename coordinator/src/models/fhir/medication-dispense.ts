import {CodeableConcept, Identifier, Resource, SimpleQuantity} from "./common"

export interface MedicationDispense extends Resource {
    identifier: Array<Identifier>
    medicationCodeableConcept: CodeableConcept
    quantity: SimpleQuantity
}
