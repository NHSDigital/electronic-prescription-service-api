import path from "path"
import {normalizeFileName} from "./utils/common.js"
import {downloadSimplifierPackage} from "./utils/download-simplifier-package.js"
import {parseFhirSchema} from "./utils/parse-fhir-schema.js"
import {generateSchema} from "./utils/generate-schema.js"

const SIMPLIFIER_REGISTRY_URL = "https://packages.simplifier.net"
const PACKAGE_NAME = "hl7.fhir.r4.core"
const PACKAGE_VERSION = "latest"
const ENTRY_SCHEMA_FILE = "MedicationRequest.schema.json"

function getOutputPath() {
  return path.join(
    process.cwd(),
    ".output",
    "parsed",
    normalizeFileName(`${PACKAGE_NAME}-${PACKAGE_VERSION}`)
  )
}

async function runSchemaGenerationPipeline() {
  console.log("Starting schema generation pipeline...")

  const outputPath = getOutputPath()

  console.log("\n=== Step 1: download simplifier package ===")
  await downloadSimplifierPackage(
    SIMPLIFIER_REGISTRY_URL,
    PACKAGE_NAME,
    outputPath,
    PACKAGE_VERSION
  )

  console.log("\n=== Step 2: parse FHIR schema ===")
  const parsedSchema = parseFhirSchema(outputPath, ENTRY_SCHEMA_FILE)

  console.log("\n=== Step 3: generate schema ===")
  const generatedSchemas = generateSchema(parsedSchema)

  for (const [schemaName, schema] of Object.entries(generatedSchemas)) {
    console.log(`\n--- ${schemaName} ---`)
    console.log(JSON.stringify(schema, null, 2))
  }

  console.log("\nGeneration complete")
}

runSchemaGenerationPipeline().catch((error) => {
  console.error("\nSchema generation pipeline failed")
  console.error(error)
  process.exit(1)
})
