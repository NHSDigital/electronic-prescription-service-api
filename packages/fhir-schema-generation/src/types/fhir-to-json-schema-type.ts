import {JSONSchemaType} from "json-schema-to-ts/lib/types/definitions/jsonSchema.js"

export const FHIR_TO_JSON_SCHEMA_TYPE: Readonly<Record<string, JSONSchemaType>> = {
  boolean: "boolean",
  integer: "integer",
  string: "string",
  decimal: "number"
}
