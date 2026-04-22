import {StructureDefinitionExtension} from "./extension.interface.js"

export interface StructureDefinitionType {
    code: string
    extension: Array<StructureDefinitionExtension>
}
