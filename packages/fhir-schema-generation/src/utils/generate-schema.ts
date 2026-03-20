import * as fs from "fs"
import {z} from "zod"
import {SchemaNode, SchemaBody, SchemaReference} from "../models/schema/schema-node"
import {
  schemaPropertyBool,
  schemaPropertyEnum,
  schemaPropertyInteger,
  SchemaPropertyItem,
  schemaPropertyItem,
  schemaPropertyPattern
} from "../models/schema/schema-property"

function updateZodObject(
  propertyName: string,
  property: SchemaPropertyItem,
  item: z.ZodObject<any>,
  required: boolean
): z.ZodObject<any> {
  // 1. Check for the unique "$ref" key
  if ("$ref" in property) {
    console.log(`Skip Reference for ${propertyName}:`, property.$ref)
    return item
  }

  let validator: z.ZodTypeAny = z.any()

  switch (property.type) {
    case "array": {
      let innerValidator: z.ZodTypeAny = z.any()
      validator = z.array(innerValidator)
      break
    }

    case "boolean": {
      const boolProperty = schemaPropertyBool.safeParse(property)
      if (boolProperty.success) {
        validator = z.boolean()
      }
      break
    }

    case "number": {
      const numberType = schemaPropertyInteger.safeParse(property)
      if (numberType.success) {
        const {pattern} = numberType.data

        validator = pattern
          ? z.number().refine(
            (val) => new RegExp(pattern).test(String(val)),
            {message: `Number must match the pattern ${pattern}`}
          )
          : z.number()
      }
      break
    }

    case "string": {
      if ("enum" in property) {
        const enumProperty = schemaPropertyEnum.safeParse(property)
        if (enumProperty.success) {
          validator = z.enum(enumProperty.data.enum as [string, ...Array<string>])
        }
      } else if ("pattern" in property) {
        const patternProperty = schemaPropertyPattern.safeParse(property)
        if (patternProperty.success) {
          validator = z.string().regex(new RegExp(patternProperty.data.pattern))
        }
      } else {
        validator = z.string()
      }
      break
    }
  }

  if (!required) {
    validator = validator.optional()
  }

  return item.extend({[propertyName]: validator})
}

async function getProperties(schema: Record<string, any>): Promise<Record<string, z.ZodObject>> {
  const definitions: Record<string, z.ZodObject> = {}

  for (const [definitionTitle, definitionBody] of Object.entries<any>(schema.definitions)) {
    let schemaItem: z.ZodObject = z.object({})
    const required = await z.safeParseAsync(z.array(z.string()), definitionBody["required"])

    const allOf = await z.safeParseAsync(SchemaNode, definitionBody["allOf"])

    if (!allOf.success) {
      console.error("Could not safely parse \"allOf\" in definitionBody", allOf.error)
      continue
    }

    for (const node of allOf.data) {
      const reference = await SchemaReference.safeParseAsync(node)
      if (reference.success) {
        // We don't want to look into references right now
        console.info("Skipping reference node")
        continue
      }

      const nodeBody = await SchemaBody.safeParseAsync(node)
      if (!nodeBody.success) {
        console.error("Could not safely parse schemaBody to a nodeBody")
        continue
      }

      for (const [propertyName, propertyBody] of Object.entries<any>(nodeBody.data.properties)) {

        const item = await schemaPropertyItem.safeParseAsync(propertyBody)
        if (!item.success) {
          console.error("Could not safely parse property to a item", propertyBody)
          continue
        }

        if ("$ref" in item.data) {
          console.log("Skipping reference item")
          continue
        }

        const isRequired = required.success && required.data.includes(propertyName)
        schemaItem = await updateZodObject(propertyName, item.data, schemaItem, isRequired)
      }
    }

    definitions[definitionTitle] = schemaItem
  }

  return definitions
}

export async function generateSchema(directory: string): Promise<void> {
  console.log("Generating Schema")
  try {
    const file = fs.readFileSync(`${directory}/openapi/MedicationRequest.schema.json`, "utf-8")
    const medicationRequestSchema: Record<string, any> = JSON.parse(file)

    // For now, pulls out only
    const medicationType = (await getProperties(medicationRequestSchema))

    for (const record of Object.entries(medicationType)) {
      console.log(record[0], record[1]?.toJSONSchema())
    }

  } catch (e) {
    console.error("Fail", e)
  }
}
