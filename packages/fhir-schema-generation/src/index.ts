import * as fs from "node:fs"
import * as path from "node:path"

import {normalizeFileName} from "./utils/common.js"
import {downloadSimplifierPackage} from "./utils/download-simplifier-package.js"
import {generateSchema} from "./utils/generate-openapi-schema.js"
import {parseSimplifierPackage} from "./utils/parse-simplifier-package.js"
import {filterRequiredSchemas} from "./utils/filter-schema.js"

const SIMPLIFIER_REGISTRY_URL = "https://packages.simplifier.net"
const PACKAGE_NAME = "hl7.fhir.r4.core"
const PACKAGE_VERSION = "latest"
const ENTRY_SCHEMA_FILE = "StructureDefinition-MedicationRequest.json"

function buildOutputPath(): string {
  return path.join(
    process.cwd(),
    ".output",
    "parsed",
    normalizeFileName(`${PACKAGE_NAME}-${PACKAGE_VERSION}`)
  )
}

function writeSchemas(outputDir: string, schemas: Record<string, unknown>): void {
  fs.mkdirSync(outputDir, {recursive: true})

  for (const [name, schema] of Object.entries(schemas)) {
    const filePath = path.join(outputDir, `${name}.schema.json`)
    fs.writeFileSync(filePath, JSON.stringify(schema, null, 2), "utf-8")
    console.log(`Written: ${filePath}`)
  }
}

async function runSchemaGenerationPipeline(): Promise<void> {
  const outputPath = buildOutputPath()
  const packagePath = path.join(outputPath, "package")

  console.log("Downloading simplifier package...")
  await downloadSimplifierPackage(SIMPLIFIER_REGISTRY_URL, PACKAGE_NAME, outputPath, PACKAGE_VERSION)

  console.log("Parsing fhir schema...")
  const entryFilePath = path.join(packagePath, ENTRY_SCHEMA_FILE)
  const parsedSchema = parseSimplifierPackage(entryFilePath)

  console.log("Generating json schemas...")
  const schemas = generateSchema(parsedSchema, packagePath)

  console.log("Filter required json schemas...")
  const filteredSchemas = filterRequiredSchemas(schemas)

  console.log("Writing output...")
  const buildDir = path.join(process.cwd(), "build", "openapi")
  writeSchemas(buildDir, filteredSchemas)

  console.log("Done")
}

try {
  await runSchemaGenerationPipeline()
} catch (error) {
  console.error("Schema generation failed", error)
  process.exit(1)
}
