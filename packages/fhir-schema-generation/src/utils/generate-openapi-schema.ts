import * as path from "node:path"

import {JSONSchemaType} from "json-schema-to-ts/lib/types/definitions/jsonSchema.js"

import {StructureDefinition} from "../models/fhir-package/structure-definition.interface.js"
import {StructureDefinitionBaseElement} from "../models/structure-definition/base-element.interface.js"
import {StructureDefinitionDifferential} from "../models/structure-definition/differential-element.interface.js"
import {EditableJSONSchema} from "../types/editable-json-schema.type.js"
import {FHIR_TO_JSON_SCHEMA_TYPE} from "../types/fhir-to-json-schema-type.js"
import {parseSimplifierPackage} from "./parse-simplifier-package.js"

// shape of the body inside allOf[1] that we construct and mutate
interface AllOfBody {
  description?: string
  properties: Record<string, EditableJSONSchema>
  required?: Array<string>
}

// shape of each definition entry we build in the definitions record
interface AllOfDefinition {
  allOf: [EditableJSONSchema, AllOfBody]
}

const SCHEMA_VERSION = "http://json-schema.org/draft-04/schema#"
const SCHEMA_ID_PREFIX = "http://hl7.org/fhir/json-schema/"
const SCHEMA_DESCRIPTION = "see http://hl7.org/fhir/json.html#schema for information about the FHIR Json Schemas"

// resolves a fhir structure definition into json schema, recursively loading
// dependencies from the package directory. returns all resolved schemas keyed by id.
export function generateSchema(
  structureDefinition: StructureDefinition,
  packagePath: string,
  filePrefix: string = "StructureDefinition-"
): Record<string, EditableJSONSchema> {
  const resolved = new Map<string, EditableJSONSchema>()
  const primitives = new Map<string, EditableJSONSchema>()
  const inProgress = new Set<string>()

  const result = processDefinition(structureDefinition, resolved, primitives, inProgress, packagePath, filePrefix)

  if (result !== undefined) {
    resolved.set(structureDefinition.id, result)
  }

  return Object.fromEntries(resolved)
}

// wraps a schema in array notation when cardinality indicates multiple values.
// max > 1 or "*" means array. minItems from min, maxItems from max (omitted for "*").
export function applyCardinality(
  schema: EditableJSONSchema,
  element: StructureDefinitionBaseElement
): EditableJSONSchema {
  const max = element.max
  const min = element.min ?? 0
  const isArray = max === "*" || (max !== undefined && parseInt(max) > 1)

  if (!isArray) {
    return schema
  }

  const arraySchema: EditableJSONSchema = {
    type: "array",
    items: schema,
    minItems: min
  }

  if (max !== "*") {
    arraySchema.maxItems = parseInt(max!)
  }

  return arraySchema
}

// returns true when the element's short description contains pipe-separated
// binding values (e.g. "active | on-hold | cancelled").
export function hasBindingEnum(element: StructureDefinitionBaseElement): boolean {
  return element.short !== undefined && element.short.includes(" | ")
}

// converts a pipe-separated short description into a JSON Schema enum property.
export function buildBindingEnum(element: StructureDefinitionBaseElement): EditableJSONSchema {
  return {
    description: element.definition,
    enum: element.short!.split("|").map((item) => item.trim()),
    type: "string"
  }
}

// derives a base class $ref from the structure definition.
// uses baseDefinition when available, otherwise falls back to DomainResource.
function deriveBaseRef(schema: StructureDefinition): string {
  const baseClass = schema.baseDefinition
    ? schema.baseDefinition.split("/").pop()!
    : "DomainResource"

  return `${baseClass}#/definitions/${baseClass}`
}

// sets a deeply nested property on an object, creating intermediate objects as needed.
function setNestedProp(
  obj: Record<string, EditableJSONSchema>,
  propertyPath: Array<string>,
  value: EditableJSONSchema
): void {
  const pathTraverse = propertyPath.slice(0, -1)
  const finalKey = propertyPath[propertyPath.length - 1]

  const targetObj = pathTraverse.reduce<Record<string, EditableJSONSchema>>((prev, curr) => {
    if (!prev[curr]) {
      const empty: EditableJSONSchema = {}
      prev[curr] = empty
    }
    return prev[curr] as Record<string, EditableJSONSchema>
  }, obj)

  if (targetObj) {
    targetObj[finalKey] = value
  }
}

// parses an element id into a definition key and property path within that definition.
// e.g. "MedicationRequest.status" → definitionKey: "MedicationRequest", propertyPath: ["status"]
// e.g. "MedicationRequest.dispenseRequest.initialFill.duration"
//     → definitionKey: "MedicationRequest_DispenseRequest", propertyPath: ["initialFill", "duration"]
function parseElementPath(elementId: string, resourceName: string): {
  definitionKey: string
  propertyPath: Array<string>
} | undefined {
  const parts = elementId.split(".")
  if (parts.length < 2) return undefined

  // remove the resource name prefix
  parts.shift()

  // direct property of the resource (e.g. "status")
  if (parts.length === 1) {
    return {definitionKey: resourceName, propertyPath: parts}
  }

  // sub-definition: second part becomes the definition suffix
  const subPart = parts.shift()!
  const definitionKey = `${resourceName}_${subPart[0].toUpperCase()}${subPart.slice(1)}`

  return {definitionKey, propertyPath: parts}
}

function processDefinition(
  schema: StructureDefinition,
  resolved: Map<string, EditableJSONSchema>,
  primitives: Map<string, EditableJSONSchema>,
  inProgress: Set<string>,
  packagePath: string,
  filePrefix: string
): EditableJSONSchema | undefined {
  switch (schema.kind) {
    case "primitive-type":
      return buildPrimitiveSchema(schema, primitives)
    case "resource":
    case "complex-type":
      return buildResourceSchema(schema, resolved, primitives, inProgress, packagePath, filePrefix)
    default:
      return undefined
  }
}

function buildPrimitiveSchema(
  schema: StructureDefinition,
  primitives: Map<string, EditableJSONSchema>
): EditableJSONSchema {
  const type: JSONSchemaType = FHIR_TO_JSON_SCHEMA_TYPE[schema.type] ?? "string"

  const pattern = extractPrimitivePattern(schema, type)

  const result: EditableJSONSchema = {type, pattern}
  primitives.set(schema.id, result)
  return result
}

function extractPrimitivePattern(schema: StructureDefinition, type: JSONSchemaType): string | undefined {
  if (type !== "string") return undefined
  if (!schema.snapshot?.element?.length) return undefined

  // pattern lives on the last extension of the last type of the last element
  const lastElement = schema.snapshot.element[schema.snapshot.element.length - 1]
  const lastType = lastElement.type?.[lastElement.type.length - 1]

  return lastType?.extension?.[lastType.extension.length - 1]?.valueString
}

function buildResourceSchema(
  schema: StructureDefinition,
  resolved: Map<string, EditableJSONSchema>,
  primitives: Map<string, EditableJSONSchema>,
  inProgress: Set<string>,
  packagePath: string,
  filePrefix: string
): EditableJSONSchema {
  const definitions: Record<string, AllOfDefinition> = {}
  const elements: Array<StructureDefinitionDifferential> = [...(schema.differential?.element ?? [])]
    .sort((a, b) => a.id.localeCompare(b.id))

  for (const element of elements) {
    if (!element.type || element.type.length === 0) continue

    const parsed = parseElementPath(element.id, schema.name)
    if (!parsed) continue

    const {definitionKey, propertyPath} = parsed

    // initialise the definition with allOf wrapper if not yet created
    if (!definitions[definitionKey]) {
      let baseRef: string
      if (definitionKey === schema.name) {
        baseRef = deriveBaseRef(schema)
      } else {
        const baseClass = element.type[0].code || "BackboneElement"
        baseRef = `${baseClass}#/definitions/${baseClass}`
      }

      definitions[definitionKey] = {
        allOf: [
          {"$ref": baseRef},
          {
            description: element.definition,
            properties: {},
            required: []
          }
        ]
      }
    }

    const defBody = definitions[definitionKey].allOf[1]
    const fieldName = propertyPath[propertyPath.length - 1]

    // mark required fields
    if (element.min && element.min > 0 && !defBody.required?.includes(fieldName)) {
      defBody.required = defBody.required ?? []
      defBody.required.push(fieldName)
    }

    // determine the field schema value
    const code = extractTypeCode(element)
    let fieldValue: EditableJSONSchema | undefined

    // binding enums: "active | on-hold | cancelled" → JSON Schema enum
    if (hasBindingEnum(element)) {
      fieldValue = buildBindingEnum(element)
    } else {
      // ensure the dependency is resolved (loads from disk if needed)
      ensureTypeResolved(code, resolved, primitives, inProgress, packagePath, filePrefix)

      if (primitives.has(code)) {
        // primitive — inline it with description
        const primitiveSchema = primitives.get(code)!
        fieldValue = {
          description: element.definition,
          ...primitiveSchema
        }
      } else {
        // complex type — use $ref to external schema file
        fieldValue = {
          "$ref": `${code}.schema.json#/$definitions/${code}`,
          description: element.definition
        }
      }
    }

    if (fieldValue) {
      fieldValue = applyCardinality(fieldValue, element)
      setNestedProp(defBody.properties, propertyPath, fieldValue)
    }
  }

  // clean up: remove empty required arrays
  for (const def of Object.values(definitions)) {
    const body = def.allOf[1]
    if (body.required?.length === 0) {
      delete body.required
    }
  }

  // wrap in schema envelope
  if (Object.keys(definitions).length > 0) {
    return {
      description: SCHEMA_DESCRIPTION,
      "$ref": `#/definitions/${schema.name}`,
      "$id": `${SCHEMA_ID_PREFIX}${schema.name}`,
      "$schema": SCHEMA_VERSION,
      definitions: definitions as Record<string, EditableJSONSchema>
    }
  }

  return {
    description: SCHEMA_DESCRIPTION,
    "$ref": `#/definitions/${schema.name}`
  }
}

function extractTypeCode(element: StructureDefinitionBaseElement): string {
  const extensions = element.type[0].extension
  const extensionUrl = extensions?.length > 0 ? extensions[0].valueUrl : undefined

  return extensionUrl ?? element.type[0].code
}

// resolves a type code to its json schema, checking the cache first, then
// handling circular references, then loading from disk.
function ensureTypeResolved(
  code: string,
  resolved: Map<string, EditableJSONSchema>,
  primitives: Map<string, EditableJSONSchema>,
  inProgress: Set<string>,
  packagePath: string,
  filePrefix: string
): void {
  if (primitives.has(code) || resolved.has(code) || inProgress.has(code)) {
    return
  }

  const filePath = path.join(packagePath, `${filePrefix}${code}.json`)

  try {
    const depSchema = parseSimplifierPackage(filePath)

    inProgress.add(code)
    const result = processDefinition(depSchema, resolved, primitives, inProgress, packagePath, filePrefix)
    inProgress.delete(code)

    if (result !== undefined) {
      resolved.set(depSchema.id, result)
    }
  } catch {
    // dependency file doesn't exist skips gracefully
  }
}
