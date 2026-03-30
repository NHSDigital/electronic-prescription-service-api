import * as fs from "node:fs"
import * as path from "node:path"

import type {SchemaBody, SchemaReference} from "./schema-types.js"
import {isSchemaBody, isSchemaReference} from "./schema-types.js"

export interface FhirDefinition {
  allOf: Array<SchemaReference | SchemaBody>
}

export interface ParsedFhirSchema {
  definitions: Record<string, FhirDefinition>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getSchemaFilePath(directory: string, schemaFile: string): string {
  return path.join(directory, "openapi", schemaFile)
}

function parseAllOfNodes(
  definitionName: string,
  value: unknown
): Array<SchemaReference | SchemaBody> {
  if (!Array.isArray(value)) {
    return []
  }

  const parsedNodes: Array<SchemaReference | SchemaBody> = []

  for (const node of value) {
    if (isSchemaReference(node) || isSchemaBody(node)) {
      parsedNodes.push(node)
      continue
    }

    console.warn(`Skipping unrecognised allOf node in "${definitionName}"`)
  }

  return parsedNodes
}

/**
 * Reads a JSON Schema file produced by the Simplifier package and returns
 * its definitions typed with json-schema-to-ts derived types.
 *
 * @param directory Root directory of the extracted Simplifier package.
 * @param schemaFile Filename inside the `openapi/` subdirectory (for example "MedicationRequest.schema.json").
 */
export function parseFhirSchema(
  directory: string,
  schemaFile: string
): ParsedFhirSchema {
  const filePath = getSchemaFilePath(directory, schemaFile)
  console.log(`Parsing schema: ${filePath}`)

  const rawFile = fs.readFileSync(filePath, "utf-8")
  const parsedJson: unknown = JSON.parse(rawFile)

  if (!isRecord(parsedJson)) {
    throw new Error(`Schema file ${schemaFile} did not parse into an object`)
  }

  if (!isRecord(parsedJson.definitions)) {
    throw new Error(`Schema file ${schemaFile} has no definitions`)
  }

  const definitions: Record<string, FhirDefinition> = {}

  for (const [definitionName, definitionValue] of Object.entries(parsedJson.definitions)) {
    if (!isRecord(definitionValue)) {
      console.warn(`Skipping invalid definition "${definitionName}"`)
      continue
    }

    definitions[definitionName] = {
      allOf: parseAllOfNodes(definitionName, definitionValue.allOf)
    }
  }

  return {definitions}
}
