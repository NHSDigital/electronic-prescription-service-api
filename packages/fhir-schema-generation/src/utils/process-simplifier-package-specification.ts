import * as path from "node:path"
import {StructureDefinition} from "../models/fhir-package/structure-definition.interface.js"
import {JSONSchemaType} from "json-schema-to-ts/lib/types/definitions/JSONSchema.js"
import {parseSimplifierPackage} from "./parse-simplifier-package.js"
import {StructureDefinitionDifferential} from "../models/structure-definition/differential-element.interface.js"
import {DeepMutable} from "./deep-mutible.js"
import {EditableJSONSchema} from "../types/editable-json-schema.type.js"

export class SchemaProcessor {
  private specifications = new Map<string, EditableJSONSchema>()
  private definitions = new Map<string, EditableJSONSchema | undefined>()
  private primitives = new Map<string, EditableJSONSchema | undefined>()
  private inProgress = new Map<string, Array<string>>()

  private rootDir: string = ""
  private schemaVersion = "http://json-schema.org/draft-04/schema#"
  private schemaIdPrefix = "http://hl7.org/fhir/json-schema/"
  private defaultSchemaDescription
    = "see http://hl7.org/fhir/json.html#schema for information about the FHIR Json Schemas"

  private updatePrimitives(id: string, schema: EditableJSONSchema) {
    this.inProgress.delete(id)
    this.primitives.set(id, schema)
  }

  private updateSpecifications(id: string, schema: EditableJSONSchema) {
    this.inProgress.delete(id)
    this.specifications.set(id, schema)
  }

  private updateDefinitions(id: string, schema: EditableJSONSchema | undefined) {
    this.inProgress.delete(id)
    this.definitions.set(id, schema)
  }

  private processSpecification(simplifierSchema: StructureDefinition) {
    switch (simplifierSchema.kind) {
      case "primitive-type":
        this.processPrimitive(simplifierSchema)
        break
      case "complex-type":
      case "logical":
      case "resource":
        this.processResource(simplifierSchema)
        break
      default:
      // Catches anything that isn't explicitly handled above
        throw new Error(`Unrecognised specification type: ${simplifierSchema.kind}`)
    }
  }

  private processResource(simplifierSchema: StructureDefinition) {
    const properties = this.processProperties(simplifierSchema)

    let schema: DeepMutable<EditableJSONSchema> = {
      description: this.defaultSchemaDescription,
      $ref: "#/definitions/" + simplifierSchema.name
    }

    if (Object.keys(properties).length !== 0) {
      schema = {
        ...schema,
        $id: this.schemaIdPrefix + simplifierSchema.name,
        $schema: this.schemaVersion,
        definitions: properties
      }
    }

    this.updateSpecifications(simplifierSchema.id, schema)
  }

  private processPrimitive(simplifierSchema: StructureDefinition): EditableJSONSchema {
    const type: JSONSchemaType = ["boolean", "integer", "string", "decimal"].includes(simplifierSchema.type)
      ? simplifierSchema.type as JSONSchemaType
      : "string"
    let pattern: string | undefined = undefined

    if (type === "string") {
      const differential = simplifierSchema.differential.element.at(-1)
      const snapType = differential?.type.at(-1)
      const snapValue = snapType?.extension.at(-1)?.valueString
      pattern = snapValue
    }

    const schema: EditableJSONSchema = {type, pattern}
    this.updatePrimitives(simplifierSchema.id, schema)
    return schema
  }

  private setNestedProp(obj: any, pathArray: Array<string>, newValue: any): void {
    const pathTraverse = pathArray.slice(0, -1)
    const finalKey = pathArray[pathArray.length - 1]

    const targetObj = pathTraverse.reduce((prev, curr) => prev?.[curr], obj)

    if (targetObj) {
      targetObj[finalKey] = newValue
    }

    return obj
  };

  private processProperties(simplifierSchema: StructureDefinition): Record<string, EditableJSONSchema> {
    return simplifierSchema
      .differential
      .element
      .reduce((result: Record<string, EditableJSONSchema>, current: StructureDefinitionDifferential) => {
        // Get id parts
        const idParts: Array<string> = current.id.split(".").reverse()

        // Get object name (i.e., MedicationRequest)
        let prop = idParts.pop()!

        const types = current.type

        // Only process if the object has a type
        if (types && types.length > 0) {
          // Check if item is a sub-definition (i.e., MedicationRequest_Requester)
          if (idParts.length > 1) {
            prop += `_${idParts.pop()}`
          }

          // Check if the element is required
          const extensions = types[0].extension
          const extension = extensions?.length > 0 ? extensions[0].valueUrl : undefined
          const code = extension ?? types[0].code

          if (current.min && current.min > 0) {
            result[prop] = result[prop] || {} satisfies DeepMutable<EditableJSONSchema>
            (result[prop] as Exclude<DeepMutable<EditableJSONSchema>, boolean>).required = [
              ...((result[prop] as Exclude<EditableJSONSchema, boolean>).required ?? []),
              current.id
            ]
          }

          // Check specifications, definitions, and progress states
          const existingSpec = this.specifications.get(code)
          const existingDef = this.definitions.get(code)
          const isInProgress = this.inProgress.has(code)

          if (existingSpec) {
            // Check if this specification has already been processed
            this.setNestedProp(result[prop], idParts, {
              ...existingSpec,
              description: current.definition
            })
          } else if (existingDef) {
            // Check if this specification has already been processed as a definition
            this.setNestedProp(result[prop], idParts, {
              "$ref": `#/$defs/${code}`,
              description: current.definition
            })
          } else if (isInProgress) {
            // Check if this specification is complex and requires a definition
            this.setNestedProp(result[prop], idParts, {
              "$ref": `#/$defs/${code}`,
              description: current.definition
            })
            this.updateDefinitions(code, undefined)
          } else {
            // Handle the specification as a normal property
            const processed = this.processProperty(current, code)
            if (processed) {
              if (this.definitions.has(code)) {
                this.setNestedProp(result[prop], idParts, {
                  "$ref": `#/$defs/${code}`,
                  description: current.definition
                })
                this.definitions.set(code, processed)
                this.specifications.delete(code)
              } else {
                this.setNestedProp(result[prop], idParts, {
                  ...processed,
                  description: current.definition
                })
              }
            }
          }
        }

        return result
      }, {})
  }

  private processProperty(element: StructureDefinitionDifferential, code: string): EditableJSONSchema | undefined {

    // Recursively process the dependency
    this.processSimplifierPackageSpecifications(`${this.rootDir}${code}.json`)
    const found = this.specifications.get(code) as Exclude<EditableJSONSchema, boolean>

    if (found && element.max === "*") {
      return {type: "array", items: found}
    }
    return found
  }

  public getSpecifications(): Map<string, EditableJSONSchema> {
    return this.specifications
  }

  public processSimplifierPackageSpecifications(filePath: string, prefix: string = ""): void {
    if (!this.rootDir) {
      this.rootDir = path.join(filePath.substring(0, filePath.lastIndexOf("/")), prefix)
    }

    const parsedSchema = parseSimplifierPackage(filePath)

    this.inProgress.set(parsedSchema.id, [])
    this.processSpecification(parsedSchema)
  }
}
