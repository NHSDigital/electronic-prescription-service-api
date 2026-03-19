import * as fs from "fs"
import {z, ZodError} from "zod"
import {SchemaNode, SchemaBody, SchemaReference} from "../models/schema/schema-node"
import {
  schemaPropertyBool,
  schemaPropertyEnum,
  schemaPropertyInteger,
  SchemaPropertyItem,
  schemaPropertyItem,
  schemaPropertyPattern
} from "../models/schema/schema-property"

async function getPropertyType(item: SchemaPropertyItem): Promise<z.ZodTypeAny> {
  // 1. Check for the unique "$ref" key
  if ("$ref" in item) {
    console.log("It's a Reference:", item.$ref)
    return z.any() // Don't handle references
  }

  // 2. Switch on the "type" literal
  switch (item.type) {
    case "array": {
      return z.string() // Don't handle arrays
    }
    case "boolean": {
      const boolProperty = await schemaPropertyBool.safeParseAsync(item)
      if (boolProperty.success) {
        return z.boolean()
      }
      break
    }
    case "number":{
      const numberType = await schemaPropertyInteger.safeParseAsync(item)
      if (numberType.success) {
        return z.number().refine(
          (val) => !!numberType.data.pattern && RegExp(numberType.data.pattern).test(String(val)),
          {
            message: `Number must match the pattern ${numberType.data.pattern}`
          }
        )
      }
      break
    }
    case "string":
      // Both Enum and Pattern share type: "string", so check unique keys
      if ("enum" in item) {
        const enumProperty = await schemaPropertyEnum.safeParseAsync(item)
        if (enumProperty.success) {
          return z.enum(enumProperty.data.enum)
        }
        break
      } else if ("pattern" in item) {
        const patternProperty = await schemaPropertyPattern.safeParseAsync(item)
        if (patternProperty.success) {
          return z.string().regex(RegExp(patternProperty.data.pattern))
        }
      }
      break
  }

  throw new ZodError([
    {
      code: "custom",
      message: `Unable to parse SchemaPropertyItem. Unrecognized type or missing fields.`,
      path: []
    }
  ])
}

async function getProperties(schema: Record<string, any>): Promise<Array<z.ZodObject>> {
  const definitions: Array<z.ZodObject> = []

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [definitionTitle, definitionBody] of Object.entries<any>(schema.definitions)) {
    const properties: Record<string, z.ZodTypeAny> = {}
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

        let propertyType = await getPropertyType(item.data)
        if (!required.success || !required.data.includes(propertyName)) {
          propertyType = propertyType.optional()
        }

        properties[propertyName] = propertyType
      }
    }

    definitions.push(z.object(properties))
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
    console.log(medicationType.map((type) => type.toJSONSchema()))

  } catch (e) {
    console.error("Fail", e)
  }
}
