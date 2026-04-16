import * as path from "node:path"
import {StructureDefinition} from "../models/fhir-package/structure-definition.interface.js"
import {JSONSchemaType} from "json-schema-to-ts/lib/types/definitions/JSONSchema.js"
import {parseSimplifierPackage} from "./parse-simplifier-package.js"
import {StructureDefinitionDifferential} from "../models/structure-definition/differential-element.interface.js"
import {DeepMutable} from "../types/deep-mutable.type.js"
import {EditableJSONSchema} from "../types/editable-json-schema.type.js"
import {StructureDefinitionBaseElement} from "../models/structure-definition/base-element.interface.js"

export class SchemaProcessor {
  private specifications = new Map<string, EditableJSONSchema>()
  private definitions = new Map<string, EditableJSONSchema | undefined>()
  private primitives = new Map<string, EditableJSONSchema | undefined>()
  private inProgress = new Map<string, Array<string>>()

  private rootDir: string = ""
  private readonly schemaVersion = "http://json-schema.org/draft-04/schema#"
  private readonly schemaIdPrefix = "http://hl7.org/fhir/json-schema" // NOSONAR
  private readonly defaultSchemaDescription
    = "see http://hl7.org/fhir/json.html#schema for information about the FHIR Json Schemas"

  private updatePrimitives(id: string, schema: EditableJSONSchema) {
    this.inProgress.delete(id)
    this.primitives.set(id, schema)
  }

  private updateSpecifications(id: string, schema: EditableJSONSchema) {
    this.inProgress.delete(id)
    this.specifications.set(id, schema)
  }

  private initializeSchemaDefinition(
    result: Record<string, EditableJSONSchema>,
    prop: string,
    current: any,
    simplifierSchema: StructureDefinition
  ): void {
    // Initialize the definition object with the allOf wrapper if it doesn't exist
    if (result[prop]) return

    let baseRef: string

    if (prop === simplifierSchema.name) {
      const baseClass = simplifierSchema.baseDefinition
        ? simplifierSchema.baseDefinition.split("/").pop()!
        : "DomainResource"
      baseRef = `${baseClass}#/definitions/${baseClass}`
    } else {
      const baseClass = current.type[0].code || "BackboneElement"
      baseRef = `${baseClass}#/definitions/${baseClass}`
    }

    result[prop] = {
      allOf: [
        {$ref: baseRef},
        {
          description: current.definition,
          properties: {}
        }
      ]
    } as unknown as EditableJSONSchema
  }

  private extractPropertyName(idParts: Array<string>): string {
    let prop = idParts.pop()!

    if (idParts.length > 1) {
      const postfix = idParts.pop()!
      prop += `_${postfix[0].toUpperCase()}${postfix.slice(1)}`
    }
    return prop
  }

  private resolveTypeCode(typeDef: any): string {
    const extensions = typeDef.extension
    const extensionUrl = extensions?.length > 0 ? extensions[0].valueUrl : undefined

    // Check if nullable because valueURL can be nullable
    return extensionUrl ?? typeDef.code
  }

  private handleDependencies(current: any, code: string, elements: Array<any>): void {
    const existingSpec = this.specifications.get(code)
    const existingDef = this.definitions.get(code)
    const isInProgress = this.inProgress.has(code)
    const isPrimitive = this.primitives.has(code)

    // Push unresolved items back to the elements array to process later
    if (!(existingSpec || existingDef || isInProgress || isPrimitive)) {
      this.processProperty(current, code)
      elements.push(current)
    }
  }

  private isDefinitionRequired(
    schema: EditableJSONSchema,
    current: StructureDefinitionBaseElement,
    fieldName: string
  ): boolean {
    const definitionBody = schema.allOf[1]

    // Don't include extension objects
    const isExtensionObject = Object.keys(definitionBody.properties)
      .filter((name) => name.includes(`_${name}`))

    if (isExtensionObject?.length > 0) {
      console.log("isExtensionObject", isExtensionObject, fieldName)
      return false
    }

    const hasMinimumValue = current.min && current.min > 0
    if (hasMinimumValue || current.mustSupport) {
      return true
    }

    return false
  }

  private processElement(
    current: any,
    elements: Array<any>,
    result: Record<string, EditableJSONSchema>,
    simplifierSchema: StructureDefinition
  ): void {
    const types = current.type

    // Only process if the object has a type
    if (!types || types.length === 0) return

    // Check if item is a sub-definition (i.e., MedicationRequest_Requester)
    const idParts = current.id.split(".").reverse()
    const prop = this.extractPropertyName(idParts)

    this.initializeSchemaDefinition(result, prop, current, simplifierSchema)

    // Check if item is required, and if so updates schema
    const required = this.isDefinitionRequired(result[prop], current, idParts[0])
    if (!required) {
      return
    }

    const code = this.resolveTypeCode(types[0])
    console.log("idParts", idParts)

    // Check if dependencies/ child elements are missing
    this.handleDependencies(current, code, elements)

    // Correct idParts and add element to schema
    idParts.reverse()
    this.assignPropertySchema(result[prop], current, code, idParts)
  }

  private processProperties(simplifierSchema: StructureDefinition): Record<string, EditableJSONSchema> {
    const result: Record<string, EditableJSONSchema> = {}
    const elements = simplifierSchema.differential.element.sort((a, b) => a.id.localeCompare(b.id))

    for (const current of elements) {
      this.processElement(current, elements, result, simplifierSchema)
    }

    return result
  }

  private processPrimitive(simplifierSchema: StructureDefinition): void {
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
        $id: path.join(this.schemaIdPrefix, simplifierSchema.name),
        $schema: this.schemaVersion,
        definitions: properties
      }
    }

    this.updateSpecifications(simplifierSchema.id, schema)
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

  private setNestedProp(obj: any, pathArray: Array<string>, newValue: any): void {
    const pathTraverse = pathArray.slice(0, -1)
    let finalKey = pathArray.at(-1)
    finalKey = finalKey?.split("[x]").shift()

    // Create intermediate objects if they don't exist
    const targetObj = pathTraverse.reduce((prev, curr) => {
      prev[curr] = prev[curr] || {}
      return prev[curr]
    }, obj)

    if (targetObj && finalKey) {
      targetObj[finalKey] = newValue
    }
  }

  private assignPropertySchema(schema: any, current: any, code: string, idParts: Array<string>): void {
    const targetProperties = schema.allOf[1].properties
    let requiresExtension = false

    if (current.short?.includes(" | ")) {
      this.setNestedProp(targetProperties, idParts, {
        description: current.definition,
        enum: current.short.split("|").map((item: string) => item.trim()),
        type: "string"
      })
      requiresExtension = true
    } else if (this.primitives.has(code)) {
      this.setNestedProp(targetProperties, idParts, {
        description: current.definition,
        type: current.type,
        ...(this.primitives.get(code) ?? {} as any)
      })
      requiresExtension = true
    } else if (!this.inProgress.has(code)) {
      this.setNestedProp(targetProperties, idParts, {
        $ref: `${code}.schema.json#/$definitions/${code}`,
        description: current.definition
      })
    }

    // Primitive types can be replaced or accompanied by an extension object using an underscore prefix
    if (requiresExtension && idParts.length > 0) {
      let element = idParts[idParts.length - 1]
      element = element.split("[x]").shift() ?? element

      const parentParts = idParts.slice(0, -1)

      this.setNestedProp(targetProperties, [...parentParts, `_${element}`], {
        description: `Extensions for ${element}`,
        type: this.definitions.get("Element")
      })
    }
  }

  public processSimplifierPackageSpecifications(filePath: string, prefix: string = ""): void {
    if (!this.rootDir) {
      this.rootDir = path.join(filePath.substring(0, filePath.lastIndexOf("/")), prefix)
    }

    const parsedSchema = parseSimplifierPackage(filePath)

    this.inProgress.set(parsedSchema.id, [])
    this.processSpecification(parsedSchema)
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
}
