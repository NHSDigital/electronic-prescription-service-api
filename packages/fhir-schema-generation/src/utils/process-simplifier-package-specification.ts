import * as path from "node:path"
import {StructureDefinition} from "../models/fhir-package/structure-definition.interface.js"
import {JSONSchema, JSONSchemaType} from "json-schema-to-ts/lib/types/definitions/jsonSchema.js"
import {parseSimplifierPackage} from "./parse-simplifier-package.js"
import {StructureDefinitionDifferential} from "../models/structure-definition/differential-element.interface.js"
import {DeepMutable} from "./deep-mutible.js"

export class SchemaProcessor {
  private specifications = new Map<string, JSONSchema>()
  private definitions = new Map<string, JSONSchema | undefined>()
  private primitives = new Map<string, JSONSchema | undefined>()
  private inProgress = new Map<string, Array<string>>()

  private rootDir: string = ""
  private schemaVersion = "http://json-schema.org/draft-04/schema#"
  private schemaIdPrefix = "http://hl7.org/fhir/json-schema/"
  private defaultSchemaDescription
    = "see http://hl7.org/fhir/json.html#schema for information about the FHIR Json Schemas"

  private updatePrimitives(id: string, schema: JSONSchema) {
    this.inProgress.delete(id)
    this.primitives.set(id, schema)
  }

  private updateSpecifications(id: string, schema: JSONSchema) {
    this.inProgress.delete(id)
    this.specifications.set(id, schema)
  }

  private updateDefinitions(id: string, schema: JSONSchema | undefined) {
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

    let schema: DeepMutable<JSONSchema> = {
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

  private processPrimitive(simplifierSchema: StructureDefinition): JSONSchema {
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

    const schema: JSONSchema = {type, pattern}
    this.updatePrimitives(simplifierSchema.id, schema)
    return schema
  }

  private setNestedProp(obj: any, pathArray: Array<string>, newValue: any): void {
    // 1. Separate the path to traverse from the final key
    const pathTraverse = pathArray.slice(0, -1) // ["apple", "core", "seed"]
    const finalKey = pathArray[pathArray.length - 1] // "type"

    // 2. Drill down to the parent object
    const targetObj = pathTraverse.reduce((prev, curr) => prev?.[curr], obj)

    // 3. Update the value on the parent object
    if (targetObj) {
      targetObj[finalKey] = newValue
    }

    // 4. Return the fully updated object
    return obj
  };

  private processProperties(simplifierSchema: StructureDefinition): Record<string, JSONSchema> {
    return simplifierSchema
      .differential
      .element
      .reduce((result: Record<string, JSONSchema>, current: StructureDefinitionDifferential) => {
        // Get id parts
        const idParts: Array<string> = current.id.split(".").reverse()

        // Get object name (i.e., MedicationRequest)
        let prop = idParts.pop()!

        // If the object has no type, skip - this shouldn't happen
        const types = current.type
        if (!types || types.length === 0) {
          return result
        }

        // Check if item is a sub-definition (i.e., MedicationRequest_Requester)
        if (idParts.length > 1) {
          prop += `_${idParts.pop()}`
        }

        // Check if the element is required
        const extensions = types[0].extension
        const extension = extensions?.length > 0 ? extensions[0].valueUrl : undefined
        const code = extension ?? types[0].code

        if (current.min && current.min > 0) {
          result[prop] = result[prop] || {} satisfies DeepMutable<JSONSchema>
          (result[prop] as Exclude<DeepMutable<JSONSchema>, boolean>).required = [
            ...((result[prop] as Exclude<JSONSchema, boolean>).required ?? []),
            current.id
          ]
        }

        // Check if this specification has already been processed
        const existingSpec = this.specifications.get(code)
        if (existingSpec) {
          this.setNestedProp(result[prop], idParts, existingSpec)
          return result
        }

        // Check if this specification has already been processed as a definition
        const existingDef = this.definitions.get(code)
        if (existingDef) {
          this.setNestedProp(result[prop], idParts, {"$ref": `#/$defs/${code}`})
          return result
        }

        // Check if this specification is complex and requires a definition
        const isInProgress = this.inProgress.has(code)
        if (isInProgress) {
          this.setNestedProp(result[prop], idParts, {"$ref": `#/$defs/${code}`})
          this.updateDefinitions(code, undefined)
          return result
        }

        // Handle the specification as a normal property
        const processed = this.processProperty(current, code)
        if (processed) {
          if (this.definitions.has(code)) {
            this.setNestedProp(result[prop], idParts, {"$ref": `#/$defs/${code}`})
            this.definitions.set(code, processed)
            this.specifications.delete(code)
          } else {
            this.setNestedProp(result[prop], idParts, processed)
          }
        }

        return result
      }, {})
  }

  private processProperty(element: StructureDefinitionDifferential, code: string): JSONSchema | undefined {

    // Recursively process the dependency
    this.processSimplifierPackageSpecifications(`${this.rootDir}${code}.json`)
    const found = this.specifications.get(code) as Exclude<JSONSchema, boolean>

    if (found && element.max === "*") {
      return {type: "array", items: found}
    }
    return found
  }

  public getSpecifications(): Map<string, JSONSchema> {
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
