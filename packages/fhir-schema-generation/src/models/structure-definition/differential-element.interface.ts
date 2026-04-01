import {StructureDefinitionBaseElement} from "./base-element.interface.js"

export interface StructureDefinitionDifferential extends StructureDefinitionBaseElement {
    id: string
    binding: any // TODO
}
