import {EditableJSONSchema} from "../types/editable-json-schema.type.js"

export function filterRequiredSchemas(
  schemas: Record<string, EditableJSONSchema>
): Record<string, EditableJSONSchema> {
  const requiredSchemas: Record<string, EditableJSONSchema> = {}
  const processed = new Map<string, boolean>()

  for (const [id, spec] of Object.entries(schemas)) {
    if (isPropertyRequired(spec, schemas, processed)) {
      requiredSchemas[id] = spec
    }
  }

  return requiredSchemas
}

export function isPropertyRequired(
  schema: EditableJSONSchema,
  allSchemas: Record<string, EditableJSONSchema>,
  processed: Map<string, boolean>
): boolean {
  const schemaId = schema.$id ?? schema.$ref ?? ""

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

      if (childBody && filterProperties(childBody, schema, allSchemas, processed)) {
        schemaHasRequired = true
        processed.set(localRefId, true)
      }
    }
  }

  if (schemaId) processed.set(schemaId, schemaHasRequired)
  return schemaHasRequired
}

function filterProperties(
  body: EditableJSONSchema,
  schema: EditableJSONSchema,
  allSchemas: Record<string, EditableJSONSchema>,
  processed: Map<string, boolean>
): boolean {
  if (!body.properties) return false

  const requiredProps = body.required ?? []
  let hasRequired = requiredProps.length > 0

  const filteredProperties: Record<string, any> = {}

  for (const key of Object.keys(body.properties)) {
    const prop = body.properties[key] as EditableJSONSchema
    let isRequired = requiredProps.includes(key)

    if (!isRequired && key.startsWith("_") && requiredProps.includes(key.substring(1))) {
      isRequired = true
    }

    if (!isRequired) {
      const ref = prop.$ref ?? (prop.items as EditableJSONSchema)?.$ref

      if (ref) {
        const defName = ref.split("/").at(-1) ?? ""
        const childDef = schema.definitions?.[defName] as EditableJSONSchema | undefined
        const childBody = childDef?.allOf?.at(-1) as EditableJSONSchema | undefined

        if (childBody) {
          const schemaId = `${schema.$id ?? schema.$ref ?? ""}#${defName}`
          if (processed.has(schemaId)) {
            isRequired = processed.get(schemaId)!
          } else {
            processed.set(schemaId, false)
            isRequired = filterProperties(childBody, schema, allSchemas, processed)
            processed.set(schemaId, isRequired)
          }
        } else {
          const specCode = ref.split(".schema.json").shift()
          if (specCode && allSchemas[specCode]) {
            isRequired = isPropertyRequired(allSchemas[specCode], allSchemas, processed)
          }
        }
      }
    }

    if (isRequired) {
      hasRequired = true
      filteredProperties[key] = prop
    }
  }

  body.properties = filteredProperties
  delete body.required

  return hasRequired
}
