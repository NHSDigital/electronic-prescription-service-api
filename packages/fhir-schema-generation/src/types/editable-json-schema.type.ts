import {JSONSchema} from "json-schema-to-ts/lib/types/definitions/JSONSchema.js"
import {DeepMutable} from "./deep-mutable.type.js"

export type EditableJSONSchema = Exclude<DeepMutable<JSONSchema>, boolean>
