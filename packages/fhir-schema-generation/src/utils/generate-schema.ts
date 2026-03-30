import type {SchemaPropertyItem} from "./schema-types.js"
import type {ParsedFhirSchema} from "./parse-fhir-schema.js"

import {
  isSchemaReference,
  isSchemaBody,
  isPropertyReference,
  isPropertyArray,
  isPropertyBool,
  isPropertyNumber,
  isPropertyEnum,
  isPropertyPattern
} from "./schema-types.js"

interface JsonSchemaProperty {
  type?: string
  items?: Record<string, unknown>
  pattern?: string
  enum?: Array<string>
}

interface JsonSchemaDefinition {
  type: "object"
  properties: Record<string, JsonSchemaProperty>
  required: []
}

/**
 * Maps a single schema property item to a simplified JSON Schema property
 * descriptor.  Returns `null` for `$ref` references (they are skipped for now).
 */
function buildPropertySchema(
  propertyName: string,
  property: SchemaPropertyItem
): JsonSchemaProperty | null {

  if (isPropertyReference(property)) {
    console.log(`Skip reference for ${propertyName}: ${property.$ref}`)
    return null
  }

  if (isPropertyArray(property)) {
    return {type: "array"}
  }

  if (isPropertyBool(property)) {
    return {type: "boolean"}
  }

  if (isPropertyNumber(property)) {
    return property.pattern
      ? {type: "number", pattern: property.pattern}
      : {type: "number"}
  }

  if (isPropertyEnum(property)) {
    return {type: "string", enum: property.enum}
  }

  if (isPropertyPattern(property)) {
    return {type: "string", pattern: property.pattern}
  }

  return null
}

function generateSchemaProperties(
  node: any,
  properties: Record<string, JsonSchemaProperty>,
  requiredProps: Array<string>
) {
  for (const [propName, propBody] of Object.entries(
        node.properties as Record<string, unknown>
  )) {
    if (isPropertyReference(propBody)) {
      console.log(`Skipping reference item: ${propBody.$ref}`)
      continue
    }

    const schema = buildPropertySchema(propName, propBody as SchemaPropertyItem)
    if (schema) {
      properties[propName] = schema
      if (node.required?.includes(propName)) {
        requiredProps.push(propName)
      }
    }
  }

  return { }
}

function generateSchemaNodes(
  definition: any,
  definitionTitle: string,
  output: Record<string, any>
): Record<string, JsonSchemaDefinition> {
  const properties: Record<string, JsonSchemaProperty> = {}
  const requiredProps: Array<string> = []

  for (const node of definition.allOf) {
    if (isSchemaReference(node)) {
      console.info(`Skipping reference node: ${node.$ref}`)
      continue
    }

    if (!isSchemaBody(node)) {
      continue
    }

    generateSchemaProperties(node, properties, requiredProps)
  }

  output[definitionTitle] = {
    type: "object",
    properties,
    required: requiredProps
  }

  return output
}

/**
 * Walks the parsed FHIR schema definitions and produces a simplified JSON
 * Schema for each definition.
 */
export function generateSchema(
  parsedSchema: ParsedFhirSchema
): Record<string, JsonSchemaDefinition> {
  console.log("Generating schema…")

  let output: Record<string, JsonSchemaDefinition> = {}

  for (const [definitionTitle, definition] of Object.entries(parsedSchema.definitions)) {
    output = generateSchemaNodes(definition, definitionTitle, output)
  }

  return output
}
