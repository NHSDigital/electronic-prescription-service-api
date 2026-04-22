import {StructureDefinitionIdentityMap} from "./identity-map.interface.js"
import {StructureDefinitionType} from "./type.interface.js"

export interface StructureDefinitionBaseElement {
    path: string
    short: string
    definition: string
    comment: string
    min?: number
    max?: string
    type: Array<StructureDefinitionType>
    mapping: Array<StructureDefinitionIdentityMap>
    mustSupport?: boolean
}
