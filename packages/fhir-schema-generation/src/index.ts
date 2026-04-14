import * as fs from "node:fs"
import * as path from "node:path"

import {normalizeFileName} from "./utils/common.js"
import {downloadSimplifierPackage} from "./utils/download-simplifier-package.js"
import {parseFhirSchema} from "./utils/parse-fhir-schema.js"
import {generateSchema} from "./utils/generate-schema.js"

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
    console.log(`written: ${filePath}`)
  }
}

async function run(): Promise<void> {
  const outputPath = buildOutputPath()
  const packagePath = path.join(outputPath, "package")

  // console.log("\n\n\n TEST =======")
  // const test = results.get("MedicationRequest")

  // Output to console as string
  // console.log(JSON.stringify(test))

  // Output to console as JSON
  // console.dir(test, {depth: null})
  console.log("downloading simplifier package...")
  await downloadSimplifierPackage(SIMPLIFIER_REGISTRY_URL, PACKAGE_NAME, outputPath, PACKAGE_VERSION)

  console.log("parsing fhir schema...")
  const parsedSchema = parseFhirSchema(outputPath, ENTRY_SCHEMA_FILE)

  console.log("generating json schemas...")
  const schemas = generateSchema(parsedSchema, packagePath)

  console.log("writing output...")
  const buildDir = path.join(process.cwd(), "build", "openapi")
  writeSchemas(buildDir, schemas)

  console.log("done")
}

try {
  await run()
} catch (error) {
  console.error("schema generation failed", error)
  process.exit(1)
}
