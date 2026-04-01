import {StructureDefinition} from "../models/fhir-package/structure-definition.interface.js"
import {JSONSchema} from "json-schema-to-ts"
import {StructureDefinitionSnapshot} from "../models/structure-definition/snapshot.interface.js"
import {JSONSchemaType} from "json-schema-to-ts/lib/types/definitions/jsonSchema.js"
import {parseSimplifierPackage} from "./parse-simplifier-package.js"

let rootDir: string = ""

export interface kindObject {
  type?: JSONSchemaType | ReadonlyArray<JSONSchemaType>,
  pattern?: string | undefined
}

function processSimplifierPackageProperty(
  element: StructureDefinitionSnapshot,
  existingSpecifications: Map<string, JSONSchema>
): JSONSchema | undefined {
  const types = element.type
  if (!types || types.length === 0) {
    return undefined
  }

  const extensions = types[0].extension
  const extension = extensions?.length > 0 ? extensions[0].valueUrl : undefined

  const code = extension ?? types[0].code
  processSimplifierPackageFile(`${rootDir}-${code}.json`, existingSpecifications)
  const found = existingSpecifications.get(code) as Exclude<JSONSchema, boolean>

  if (found && element.max === "*") {
    const array: JSONSchema = {
      type: "array",
      items: found
    }

    return array
  }

  return found
}

function processSimplifierPackageProperties(
  simplifierSchema: StructureDefinition,
  existingSpecifications: Map<string, JSONSchema>
): { properties: Record<string, JSONSchema>, required: Array<string> } {
  const properties: Record<string, JSONSchema> = {}
  const required: Array<string> = []

  simplifierSchema.snapshot.element.forEach((element) => {
    const id = element.id.split(".").pop()
    if (id == null || id.length === 0 && id === simplifierSchema.name) {
      return
    }

    // Check if the type has already been processed
    const existing = existingSpecifications.get(element.id)
    if (existing) {
      properties[id] = existing
      return
    }

    const processed = processSimplifierPackageProperty(element, existingSpecifications)
    if (processed) {
      properties[id] = processed
    }

    if (element.min && element.min > 0) {
      required.push(id)
    }
  })

  return {properties, required}
}

function processSimplifierPackageSpecification_Primitive(
  simplifierSchema: StructureDefinition,
  existingSpecifications: Map<string, JSONSchema>
): JSONSchema {
  const type: JSONSchemaType = ["boolean", "integer", "string", "decimal"].includes(simplifierSchema.type)
    ? simplifierSchema.type as JSONSchemaType
    : "string"
  let pattern: string | undefined = undefined

  if (type === "string") {
    const snapshot = simplifierSchema.snapshot.element[simplifierSchema.snapshot.element.length - 1]
    const snapType = snapshot.type[snapshot.type.length - 1]
    const snapValue = snapType.extension[snapType.extension.length - 1].valueString

    pattern = snapValue
  }

  const schema: JSONSchema = {
    // $id: simplifierSchema.id,
    // $ref: `#definitions/${simplifierSchema.name}`,
    // title: simplifierSchema.name,
    // description: simplifierSchema.description
    type: type,
    pattern: pattern
  }

  existingSpecifications.set(simplifierSchema.id, schema)
  return schema
}

function processSimplifierPackageSpecification_Resource(
  simplifierSchema: StructureDefinition,
  existingSpecifications: Map<string, JSONSchema>
): JSONSchema {
  // Capture base information straight from schema
  const {properties, required} = processSimplifierPackageProperties(simplifierSchema, existingSpecifications)
  const schema: JSONSchema = {
    // $id: simplifierSchema.url,
    // $ref: `#definitions/${simplifierSchema.name}`,
    title: simplifierSchema.name,
    // description: simplifierSchema.description,
    type: "object",
    properties: properties,
    required: required
  }

  existingSpecifications.set(simplifierSchema.id, schema)
  return schema
}

function processSimplifierPackageSpecification(
  simplifierSchema: StructureDefinition,
  existingSpecifications: Map<string, JSONSchema>
): JSONSchema | undefined {
  switch (simplifierSchema.kind) {
    case ("primitive-type"):
      return processSimplifierPackageSpecification_Primitive(simplifierSchema, existingSpecifications)
    case ("resource"):
      return processSimplifierPackageSpecification_Resource(simplifierSchema, existingSpecifications)
    default:
      return undefined
  }
}

export function processSimplifierPackageFile(
  filePath: string,
  existingSpecifications: Map<string, JSONSchema>
) {
  if (!rootDir) {
    rootDir = filePath.substring(0, filePath.lastIndexOf("-"))
  }

  const parsedSchema = parseSimplifierPackage(filePath)
  processSimplifierPackageSpecification(parsedSchema, existingSpecifications)
}
