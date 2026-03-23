import type {FromSchema} from "json-schema-to-ts"

/** A JSON Schema $ref reference node */
export type SchemaReference = FromSchema<{
  type: "object"
  properties: {
    $ref: { type: "string" }
  }
  required: ["$ref"]
}>

/** A JSON Schema body node containing properties and a description */
export type SchemaBody = FromSchema<{
  type: "object"
  properties: {
    description: { type: "string" }
    properties: { type: "object" }
    required: {
      type: "array"
      items: { type: "string" }
    }
  }
  required: ["description", "properties"]
}>

/** A property that is a $ref reference */
export type PropertyReference = FromSchema<{
  type: "object"
  properties: {
    $ref: { type: "string" }
    description: { type: "string" }
  }
  required: ["$ref"]
}>

/** A property with type "array" */
export type PropertyArray = FromSchema<{
  type: "object"
  properties: {
    type: { const: "array" }
    items: { type: "object" }
    description: { type: "string" }
  }
  required: ["type", "items", "description"]
}>

/** A property with type "boolean" */
export type PropertyBool = FromSchema<{
  type: "object"
  properties: {
    type: { const: "boolean" }
    description: { type: "string" }
  }
  required: ["type", "description"]
}>

/** A property with type "number" and a regex pattern */
export type PropertyNumber = FromSchema<{
  type: "object"
  properties: {
    type: { const: "number" }
    pattern: { type: "string" }
    description: { type: "string" }
  }
  required: ["type", "pattern", "description"]
}>

/** A property with type "string" and an enum constraint */
export type PropertyEnum = FromSchema<{
  type: "object"
  properties: {
    type: { const: "string" }
    enum: {
      type: "array"
      items: { type: "string" }
    }
    description: { type: "string" }
  }
  required: ["type", "enum", "description"]
}>

/** A property with type "string" and a regex pattern */
export type PropertyPattern = FromSchema<{
  type: "object"
  properties: {
    type: { const: "string" }
    pattern: { type: "string" }
    description: { type: "string" }
  }
  required: ["type", "pattern", "description"]
}>

/** Union of all recognised schema property shapes */
export type SchemaPropertyItem =
  | PropertyReference
  | PropertyArray
  | PropertyBool
  | PropertyNumber
  | PropertyEnum
  | PropertyPattern

type TypedProperty = {
  type: string
  [key: string]: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function hasKey<Key extends string>(
  value: unknown,
  key: Key
): value is Record<Key, unknown> {
  return isRecord(value) && key in value
}

function hasType(value: unknown): value is TypedProperty {
  return hasKey(value, "type") && typeof value.type === "string"
}

export function isSchemaReference(node: unknown): node is SchemaReference {
  return hasKey(node, "$ref")
}

export function isSchemaBody(node: unknown): node is SchemaBody {
  return hasKey(node, "properties") && hasKey(node, "description")
}

export function isPropertyReference(prop: unknown): prop is PropertyReference {
  return hasKey(prop, "$ref")
}

export function isPropertyArray(prop: unknown): prop is PropertyArray {
  return hasType(prop) && prop.type === "array" && hasKey(prop, "items")
}

export function isPropertyBool(prop: unknown): prop is PropertyBool {
  return hasType(prop) && prop.type === "boolean"
}

export function isPropertyNumber(prop: unknown): prop is PropertyNumber {
  return hasType(prop) && prop.type === "number" && hasKey(prop, "pattern")
}

export function isPropertyEnum(prop: unknown): prop is PropertyEnum {
  return hasType(prop) && prop.type === "string" && hasKey(prop, "enum")
}

export function isPropertyPattern(prop: unknown): prop is PropertyPattern {
  return hasType(prop) && prop.type === "string" && "pattern" in prop && !("enum" in prop)
}
