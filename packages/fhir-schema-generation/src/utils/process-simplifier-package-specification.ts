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

    // Traverse all parts of property name to build the sub-definition name
    while (idParts.length > 1) {
      const postfix = idParts.pop()!
      const cleanPostfix = postfix.split("[x]")[0]
      prop += `_${cleanPostfix[0].toUpperCase()}${cleanPostfix.slice(1)}`
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

  private applyRequiredConstraints(
    schema: EditableJSONSchema,
    current: StructureDefinitionBaseElement,
    fieldName: string
  ): void {
    const definitionBody = schema.allOf?.[1] as EditableJSONSchema

    // Don't include extension objects
    const isExtensionObject = Object.keys(definitionBody?.properties ?? {})
      .filter((name) => name.includes(`_${name}`))

    // If extension object, then original prop must be required
    if (isExtensionObject?.length > 0) {
      return
    }

    // Check if it has a minimum required count or has "mustSupport" flag
    const hasMinimumValue = current.min && current.min > 0
    if (hasMinimumValue || current.mustSupport) {
      definitionBody.required = definitionBody.required ? [...definitionBody.required, fieldName] : []
    }
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

    const code = this.resolveTypeCode(types[0])

    // Check if dependencies/ child elements are missing
    this.handleDependencies(current, code, elements)

    // Correct idParts and add element to schema
    idParts.reverse()
    this.assignPropertySchema(result[prop], current, code, idParts)

    // Check if item is required, and if so updates schema
    this.applyRequiredConstraints(result[prop], current, idParts[0])
  }

  private processProperties(simplifierSchema: StructureDefinition): Record<string, EditableJSONSchema> {
    const result: Record<string, EditableJSONSchema> = {}
    const elements = simplifierSchema.differential?.element.sort((a, b) => a.id.localeCompare(b.id)) ?? []

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
      const snapValue = snapType?.extension?.at(-1)?.valueString
      pattern = snapValue
    }

    const schema: EditableJSONSchema = {type}
    if (pattern) {
      schema.pattern = pattern
    }

    this.updatePrimitives(simplifierSchema.id, schema)
  }

  private processResource(simplifierSchema: StructureDefinition) {
    const properties = this.processProperties(simplifierSchema)

    let schema: DeepMutable<EditableJSONSchema> = {
      description: this.defaultSchemaDescription,
      $ref: "#/definitions/" + simplifierSchema.id
    }

    if (Object.keys(properties).length !== 0) {
      schema = {
        ...schema,
        $id: path.join(this.schemaIdPrefix, simplifierSchema.id),
        $schema: this.schemaVersion,
        definitions: properties
      }
    }

    this.updateSpecifications(simplifierSchema.id, schema)
  }

  private processStructureDefinition(simplifierSchema: StructureDefinition) {
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
        ...(this.primitives.get(code) ?? {} as any)
      })
      requiresExtension = true
    } else if (code === "BackboneElement" || code === "Element") {
      const parts = current.id.split(".")
      const defName = parts[0] + "_" + parts.slice(1).map((p: string) => {
        const clean = p.split("[x]")[0]
        return clean[0].toUpperCase() + clean.slice(1)
      }).join("_")

      this.setNestedProp(targetProperties, idParts, {
        $ref: `#/definitions/${defName}`,
        description: current.definition
      })
    } else if (!this.inProgress.has(code)) {
      this.setNestedProp(targetProperties, idParts, {
        $ref: `${code}.schema.json#/$definitions/${code}`,
        description: current.definition
      })
    }

    // Handle extension object using an underscore prefix
    if (requiresExtension && idParts.length > 0) {
      let element = idParts[idParts.length - 1]
      element = element.split("[x]").shift() ?? element

      const parentParts = idParts.slice(0, -1)

      this.setNestedProp(targetProperties, [...parentParts, `_${element}`], {
        description: `Extensions for ${element}`,
        $ref: "Element.schema.json#/$definitions/Element"
      })
    }
  }

  public processSpecification(filePath: string): void {

    const parsedSchema = parseSimplifierPackage(filePath)

    this.inProgress.set(parsedSchema.id, [])
    this.processStructureDefinition(parsedSchema)
  }

  public isPropertyRequired(
    schema: EditableJSONSchema,
    processed: Map<string, boolean>
  ): boolean {
    const schemaId = schema.$id ?? schema.$ref ?? ""

    // Check if we have already processed this schema to avoid infinite loops and duplicate checks
    if (schemaId && processed.has(schemaId)) {
      return processed.get(schemaId)!
    }

    if (schemaId) processed.set(schemaId, false)

    let schemaHasRequired = false

    if (schema.definitions) {
      for (const defName of Object.keys(schema.definitions)) {
        const childDef = schema.definitions[defName] as EditableJSONSchema
        const childBody = childDef.allOf?.at(-1) as EditableJSONSchema

        const localRefId = `${schemaId}#${defName}`
        if (processed.has(localRefId)) {
          if (processed.get(localRefId)) {
            schemaHasRequired = true
          }
          continue
        }

        processed.set(localRefId, false)

        if (childBody && this.filterProperties(childBody, schema, processed)) {
          schemaHasRequired = true
          processed.set(localRefId, true)
        }
      }
    }

    if (schemaId) processed.set(schemaId, schemaHasRequired)
    return schemaHasRequired
  }

  private filterProperties(
    body: EditableJSONSchema,
    schema: EditableJSONSchema,
    processed: Map<string, boolean>
  ): boolean {
    if (!body.properties) return false

    const requiredProps = body.required ?? []
    let hasRequired = requiredProps.length > 0

    const filteredProperties: Record<string, any> = {}

    // Iterate through properties to check if they, or their child, are required
    for (const key of Object.keys(body.properties)) {
      const prop = body.properties[key] as EditableJSONSchema
      let isRequired = requiredProps.includes(key)

      // Keep the extension if the non-extension is required
      if (!isRequired && key.startsWith("_") && requiredProps.includes(key.substring(1))) {
        isRequired = true
      }

      if (!isRequired) {
        const ref = prop.$ref ?? (prop.items as EditableJSONSchema)?.$ref

        // Check references and their children
        if (ref) {
          const defName = ref.split("/").at(-1) ?? "" // Take only reference name
          const childDef = schema.definitions?.[defName] as EditableJSONSchema | undefined
          const childBody = childDef?.allOf?.at(-1) as EditableJSONSchema | undefined

          const schemaId = `${schema.$id ?? schema.$ref ?? ""}#${defName}`
          if (processed.has(schemaId)) {
            // If we've already processed this reference, just get the result
            isRequired = processed.get(schemaId)!
          } else {
            // Check the reference (set as false by default to avoid infinite loop)
            processed.set(schemaId, false)
            if (childBody) {
              isRequired = this.filterProperties(childBody, schema, processed)
            }
            processed.set(schemaId, isRequired)
          }
        } else {
          // Check dependencies
          const specCode = ref?.split(".schema.json").shift()
          if (specCode && this.specifications.has(specCode)) {
            const spec = this.specifications.get(specCode)!
            isRequired = this.isPropertyRequired(spec, processed)
          }
        }
      }

      if (isRequired) {
        hasRequired = true
        // Add the property to our new object instead of deleting unrequired ones
        filteredProperties[key] = prop
      }
    }

    // Reassign the filtered properties back to the body
    body.properties = filteredProperties

    // Remove the 'required' array now that we have used it for filtering
    delete body.required

    return hasRequired
  }

  public filterRequiredSpecifications(): Array<string> {
    const requiredSchemas: Array<string> = []
    const processed = new Map<string, boolean>()

    for (const [id, spec] of this.specifications) {
      const required = this.isPropertyRequired(spec, processed)

      if (required) {
        requiredSchemas.push(id)
      }
    }

    return requiredSchemas
  }

  public processSimplifierPackageSpecifications(filenames: Array<string>, prefix: string = ""): void {
    if (!this.rootDir) {
      const filePath = filenames.find((name) => !!name)
      if (!filePath) {
        return
      }

      this.rootDir = path.join(filePath.substring(0, filePath.lastIndexOf("/")), prefix)
    }

    filenames.forEach((file) => this.processSpecification(file))
    this.filterRequiredSpecifications()
  }

  private processProperty(element: StructureDefinitionDifferential, code: string): EditableJSONSchema | undefined {
    // Recursively process the dependency
    this.processSpecification(`${this.rootDir}${code}.json`)
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
