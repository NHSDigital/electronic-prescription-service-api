import {StructureDefinitionBaseElement} from "./base-element.interface.js"
import {StructureDefinitionExtension} from "./extension.interface.js"

export interface StructureDefinitionDifferential extends StructureDefinitionBaseElement {
    id: string
    binding?: {
        extension: Array<StructureDefinitionExtension> | undefined
    }
}
