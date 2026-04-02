import * as path from "node:path"
import {StructureDefinition} from "../models/fhir-package/structure-definition.interface.js"
import {JSONSchema} from "json-schema-to-ts"
import {JSONSchemaType} from "json-schema-to-ts/lib/types/definitions/jsonSchema.js"
import {parseSimplifierPackage} from "./parse-simplifier-package.js"
import {StructureDefinitionDifferential} from "../models/structure-definition/differential-element.interface.js"

export class SchemaProcessor {
  private specifications = new Map<string, JSONSchema>()
  private definitions = new Map<string, JSONSchema | undefined>()
  private inProgress = new Map<string, Array<string>>()

  private rootDir: string = ""

  private updateSpecifications(id: string, schema: JSONSchema) {
    this.inProgress.delete(id)
    this.specifications.set(id, schema)
  }

  private updateDefinitions(id: string, schema: JSONSchema | undefined) {
    this.inProgress.delete(id)
    this.definitions.set(id, schema)
  }

  private processSpecification(simplifierSchema: StructureDefinition): JSONSchema | undefined {

    if (simplifierSchema.kind === "primitive-type") {
      // These are the basic, single-value data types built into the system (like String, Integer, etc)
      return this.processPrimitive(simplifierSchema)
    }

    return this.processResource(simplifierSchema)
  }

  private processResource(simplifierSchema: StructureDefinition): JSONSchema {
    const {properties, required} = this.processProperties(simplifierSchema)
    let definitions: Record<string, JSONSchema> | undefined = undefined

    if (this.inProgress.size === 1 && this.inProgress.has(simplifierSchema.id)) {
      definitions = Object.fromEntries(this.definitions) as Record<string, JSONSchema>
    }

    const schema: JSONSchema = {
      title: simplifierSchema.name,
      type: "object",
      properties: properties,
      required: required.length > 0 ? required : undefined,
      definitions: definitions
    }

    this.updateSpecifications(simplifierSchema.id, schema)
    return schema
  }

  private processPrimitive(simplifierSchema: StructureDefinition): JSONSchema {
    const type: JSONSchemaType = ["boolean", "integer", "string", "decimal"].includes(simplifierSchema.type)
      ? simplifierSchema.type as JSONSchemaType
      : "string"
    let pattern: string | undefined = undefined

    if (type === "string") {
      const snapshot = simplifierSchema.snapshot.element[simplifierSchema.snapshot.element.length - 1]
      const snapType = snapshot.type[snapshot.type.length - 1]
      const snapValue = snapType.extension[snapType.extension.length - 1]?.valueString
      pattern = snapValue
    }

    const schema: JSONSchema = {type, pattern}
    this.updateSpecifications(simplifierSchema.id, schema)
    return schema
  }

  private processProperties(simplifierSchema: StructureDefinition) {
    const properties: Record<string, JSONSchema> = {}
    const required: Array<string> = []

    simplifierSchema.differential.element.forEach((element) => {
      const id = element.id.split(".").pop()
      if (!id || id === simplifierSchema.name) return

      const types = element.type
      if (!types || types.length === 0) return undefined

      const extensions = types[0].extension
      const extension = extensions?.length > 0 ? extensions[0].valueUrl : undefined
      const code = extension ?? types[0].code

      if (element.min && element.min > 0) required.push(id)

      // Check if this specification has already been processed
      const existingSpec = this.specifications.get(code)
      if (existingSpec) {
        properties[id] = existingSpec
        return
      }

      // Check if this specification has already been processed as a definition
      const existingDef = this.definitions.get(code)
      if (existingDef) {
        properties[id] = {"$ref": `#/$defs/${code}`}
        return
      }

      // Check if this specification is complex and requires a definition
      const isInProgress = this.inProgress.has(code)
      if (isInProgress) {
        properties[id] = {"$ref": `#/$defs/${code}`}
        this.updateDefinitions(code, undefined)
        return
      }

      // Handle the specification as a normal property
      const processed = this.processProperty(element, code)
      if (processed) {
        if (this.definitions.has(code)) {
          properties[id] = {"$ref": `#/$defs/${code}`}
          this.definitions.set(code, processed)
          this.specifications.delete(code)
        } else {
          properties[id] = processed
        }
      }
    })

    return {properties, required}
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

  public processSimplifierPackageSpecifications(filePath: string, prefix: string | undefined = undefined): void {
    if (!this.rootDir && prefix) {
      this.rootDir = path.join(filePath.substring(0, filePath.lastIndexOf("/")), prefix)
    }

    const parsedSchema = parseSimplifierPackage(filePath)

    this.inProgress.set(parsedSchema.id, [])
    this.processSpecification(parsedSchema)

    // if (this.inProgress.size === 0) {
    //   console.log("this.specifications", this.specifications)
    // }
  }
}
