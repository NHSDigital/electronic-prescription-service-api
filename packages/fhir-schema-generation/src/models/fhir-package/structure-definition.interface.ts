import {StructureDefinitionDifferential} from "../structure-definition/differential-element.interface.js"
import {StructureDefinitionSnapshot} from "../structure-definition/snapshot.interface.js"

export interface StructureDefinition {
    resourceType: string
    id: string
    meta: {
        lastUpdated: string
    }
    extension: [{
        url: string
        valueString: string
    }]
    url: string
    version: string
    name: string
    status: string
    date: string
    publisher: string
    contact: string
    description: string
    fhirVersion: string
    mapping: string
    kind: "primitive-type" | "complex-type" | "resource" | "logical"
    abstract: string
    type: string
    baseDefinition: string
    derivation: string
    snapshot: { element: Array<StructureDefinitionSnapshot> }
    differential: { element: Array<StructureDefinitionDifferential> }
}
