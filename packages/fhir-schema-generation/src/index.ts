import * as path from "node:path"
import {normalizeFileName} from "./utils/common.js"
import {downloadSimplifierPackage} from "./utils/download-simplifier-package.js"
import {processSimplifierPackageFile} from "./utils/process-simplifier-package-specification.js"
import {JSONSchema} from "json-schema-to-ts"

const SIMPLIFIER_REGISTRY_URL = "https://packages.simplifier.net"
const PACKAGE_NAME = "hl7.fhir.r4.core"
const PACKAGE_VERSION = "latest"

const TARGET_FILE_PREFIX = "StructureDefinition-"

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

  await downloadSimplifierPackage(
    SIMPLIFIER_REGISTRY_URL,
    PACKAGE_NAME,
    outputPath,
    PACKAGE_VERSION
  )

  const packagePath = `${outputPath}/package/`

  // const files = await getSimplifierDefinitionFiles(packagePath, TARGET_FILE_PREFIX)
  const files = [path.join(packagePath, `${TARGET_FILE_PREFIX}MedicationRequest.json`)]

  const results: Map<string, JSONSchema> = new Map()
  for (const file of files) {
    console.log("file: ", file)
    await processSimplifierPackageFile(file, results)
  }

  console.log("\n\n\n TEST =======")
  const test = results.get("MedicationRequest")
  console.log(JSON.stringify(test))
}

try {
  await runSchemaGenerationPipeline()
} catch (error) {
  console.error("\n\n=== Schema generation pipeline failed ===\n\n", error)
  process.exit(1)
}
