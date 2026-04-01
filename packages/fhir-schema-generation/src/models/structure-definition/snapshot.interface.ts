import {StructureDefinitionBaseElement} from "./base-element.interface.js"
import {StructureDefinitionConstraint} from "./constraint.interface.js"
import {StructureDefinitionDifferential} from "./differential-element.interface.js"

export interface StructureDefinitionSnapshot extends StructureDefinitionDifferential {
    base: StructureDefinitionBaseElement
    constraints: Array<StructureDefinitionConstraint>
    isModifier: boolean
    isSummary: boolean
}
