import * as path from "node:path"

import {JSONSchema} from "json-schema-to-ts"
import {JSONSchemaType} from "json-schema-to-ts/lib/types/definitions/jsonSchema.js"

import {StructureDefinition} from "../models/fhir-package/structure-definition.interface.js"
import {StructureDefinitionBaseElement} from "../models/structure-definition/base-element.interface.js"
import {parseSimplifierPackage} from "./parse-simplifier-package.js"

const SUPPORTED_PRIMITIVE_TYPES: ReadonlyArray<string> = ["boolean", "integer", "string", "decimal"]

// resolves a fhir structure definition into json schema, recursively loading
// dependencies from the package directory. returns all resolved schemas keyed by id.
export function generateSchema(
  structureDefinition: StructureDefinition,
  packagePath: string,
  filePrefix: string = "StructureDefinition-"
): Record<string, JSONSchema> {
  const resolved = new Map<string, JSONSchema>()
  const inProgress = new Set<string>()

  const result = processDefinition(structureDefinition, resolved, inProgress, packagePath, filePrefix)

  if (result !== undefined) {
    resolved.set(structureDefinition.id, result)
  }

  return Object.fromEntries(resolved)
}

// wraps a schema in array notation when cardinality indicates multiple values.
// max > 1 or "*" means array. minItems from min, maxItems from max (omitted for "*").
export function applyCardinality(schema: JSONSchema, element: StructureDefinitionBaseElement): JSONSchema {
  const max = element.max
  const min = element.min ?? 0
  const isArray = max === "*" || (max !== undefined && parseInt(max) > 1)

  if (!isArray) {
    return schema
  }

  const arraySchema: Record<string, unknown> = {
    type: "array",
    items: schema,
    minItems: min
  }

  if (max !== "*") {
    arraySchema.maxItems = parseInt(max!)
  }

  return arraySchema as JSONSchema
}

function processDefinition(
  schema: StructureDefinition,
  resolved: Map<string, JSONSchema>,
  inProgress: Set<string>,
  packagePath: string,
  filePrefix: string
): JSONSchema | undefined {
  switch (schema.kind) {
    case "primitive-type":
      return buildPrimitiveSchema(schema)
    case "resource":
    case "complex-type":
      return buildResourceSchema(schema, resolved, inProgress, packagePath, filePrefix)
    default:
      return undefined
  }
}

function buildPrimitiveSchema(schema: StructureDefinition): JSONSchema {
  const type: JSONSchemaType = SUPPORTED_PRIMITIVE_TYPES.includes(schema.type)
    ? (schema.type as JSONSchemaType)
    : "string"

  const pattern = extractPrimitivePattern(schema, type)

  return {type, pattern}
}

function extractPrimitivePattern(schema: StructureDefinition, type: JSONSchemaType): string | undefined {
  if (type !== "string") return undefined
  if (!schema.snapshot?.element?.length) return undefined

  // pattern lives on the last extension of the last type of the last element
  const lastElement = schema.snapshot.element[schema.snapshot.element.length - 1]
  const lastType = lastElement.type?.[lastElement.type.length - 1]

  return lastType?.extension?.[lastType.extension.length - 1]?.valueString
}

function isChoiceType(fieldName: string): boolean {
  return fieldName.includes("[x]")
}

function expandChoiceTypeName(fieldName: string, typeCode: string): string {
  const baseName = fieldName.replace("[x]", "")
  return baseName + typeCode.charAt(0).toUpperCase() + typeCode.slice(1)
}

function buildResourceSchema(
  schema: StructureDefinition,
  resolved: Map<string, JSONSchema>,
  inProgress: Set<string>,
  packagePath: string,
  filePrefix: string
): JSONSchema {
  const properties: Record<string, JSONSchema> = {}
  const required: Array<string> = []
  const elements = schema.snapshot?.element ?? []

  for (const element of elements) {
    const fieldName = element.id?.split(".").pop()

    if (!fieldName || fieldName === schema.name) continue
    if (!element.type || element.type.length === 0) continue

    // choice types expand into one property per type variant
    if (isChoiceType(fieldName)) {
      for (const typeEntry of element.type) {
        const code = typeEntry.extension?.length > 0
          ? (typeEntry.extension[0].valueUrl ?? typeEntry.code)
          : typeEntry.code
        const concreteName = expandChoiceTypeName(fieldName, code)

        const fieldSchema = resolveFieldSchema(code, resolved, inProgress, packagePath, filePrefix)
        if (!fieldSchema) continue

        properties[concreteName] = applyCardinality(fieldSchema, element)
      }
      continue
    }

    const code = extractTypeCode(element)

    if (element.min && element.min > 0) required.push(fieldName)

    const fieldSchema = resolveFieldSchema(code, resolved, inProgress, packagePath, filePrefix)
    if (!fieldSchema) continue

    properties[fieldName] = applyCardinality(fieldSchema, element)
  }

  const result: Record<string, unknown> = {
    title: schema.name,
    type: "object",
    properties
  }

  if (required.length > 0) {
    result.required = required
  }

  return result as JSONSchema
}

function extractTypeCode(element: StructureDefinitionBaseElement): string {
  const extensions = element.type[0].extension
  const extensionUrl = extensions?.length > 0 ? extensions[0].valueUrl : undefined

  return extensionUrl ?? element.type[0].code
}

// resolves a type code to its json schema, checking the cache first, then
// handling circular references, then loading from disk.
function resolveFieldSchema(
  code: string,
  resolved: Map<string, JSONSchema>,
  inProgress: Set<string>,
  packagePath: string,
  filePrefix: string
): JSONSchema | undefined {
  if (inProgress.has(code)) {
    return {"$ref": `#/definitions/${code}`} satisfies JSONSchema
  }

  return resolved.get(code)
    ?? resolveType(code, resolved, inProgress, packagePath, filePrefix)
}

// loads a structure definition from disk and processes it. tracks circular
// dependencies via inProgress to avoid infinite recursion.
function resolveType(
  code: string,
  resolved: Map<string, JSONSchema>,
  inProgress: Set<string>,
  packagePath: string,
  filePrefix: string
): JSONSchema | undefined {
  const filePath = path.join(packagePath, `${filePrefix}${code}.json`)

  try {
    const depSchema = parseSimplifierPackage(filePath)

    inProgress.add(code)
    const result = processDefinition(depSchema, resolved, inProgress, packagePath, filePrefix)
    inProgress.delete(code)

    if (result !== undefined) {
      resolved.set(depSchema.id, result)
    }

    return result
  } catch {
    // dependency file doesn't exist — skip gracefully
    return undefined
  }
}
