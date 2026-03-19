import {z} from "zod"

export const SchemaReference = z.object({
  "$ref": z.string()
})

export const SchemaBody = z.object({
  description: z.string(),
  properties: z.any(), // Not worried about this in this feature
  required: z.array(z.string()).optional()
})

export const SchemaNode = z.array(z.xor([
  SchemaReference,
  SchemaBody
]))
