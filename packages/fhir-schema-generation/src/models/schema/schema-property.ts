import {z} from "zod"

export const schemaPropertyReference = z.object({
  "$ref": z.string(),
  description: z.string().optional()
})

export const schemaPropertyArray = z.object({
  type: z.literal("array"),
  items: z.record(z.string(), z.any()),
  description: z.string()
})

export const schemaPropertyInteger = z.object({
  type: z.literal("number"),
  pattern: z.string(),
  description: z.string()
})

export const schemaPropertyEnum = z.object({
  type: z.literal("string"),
  enum: z.array(z.string()),
  description: z.string()
})

export const schemaPropertyBool = z.object({
  description: z.string(),
  type: z.literal("boolean")
})

export const schemaPropertyPattern = z.object({
  type: z.literal("string"),
  pattern: z.string(),
  description: z.string()
})

export const schemaPropertyItem = z.union([
  schemaPropertyReference,
  schemaPropertyArray,
  schemaPropertyEnum,
  schemaPropertyBool,
  schemaPropertyInteger,
  schemaPropertyPattern
])

export type SchemaPropertyItem = z.infer<typeof schemaPropertyItem>;
