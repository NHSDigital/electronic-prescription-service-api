import {JSONSchema} from "json-schema-to-ts/lib/types/definitions/jsonSchema.js"
import {DeepMutable} from "./deep-mutible.js"

export type EditableJSONSchema = Exclude<DeepMutable<JSONSchema>, boolean>
