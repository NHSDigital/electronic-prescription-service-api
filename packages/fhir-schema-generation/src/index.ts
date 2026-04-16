import * as path from "node:path"
import {normalizeFileName} from "./utils/common.js"
import {downloadSimplifierPackage} from "./utils/download-simplifier-package.js"
import {SchemaProcessor} from "./utils/process-simplifier-package-specification.js"

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

  // Uncomment next line to process entire package.
  // console.log("\n", `Processing ${normalizeFileName(`${PACKAGE_NAME}-${PACKAGE_VERSION}`)}`)
  // const files = await getSimplifierDefinitionFiles(packagePath, TARGET_FILE_PREFIX)

  // Currently only processing MedicationRequest.json (see above)
  console.log("\nNOTE: Only processing \"MedicationRequest\"", "\n\n")
  const files = [path.join(packagePath, `${TARGET_FILE_PREFIX}MedicationRequest.json`)]
  const processor = new SchemaProcessor()

  console.log("\n")
  for (const file of files) {
    processor.processSimplifierPackageSpecifications(file, TARGET_FILE_PREFIX)
  }

  console.log("\n")
  const results = processor.getSpecifications()
  // results.forEach((result) => console.log(JSON.stringify(result)))
  console.log(JSON.stringify(results.get("MedicationRequest")))
}

try {
  await runSchemaGenerationPipeline()
} catch (error) {
  console.error("\n\n=== Schema generation pipeline failed ===\n\n", error)
  process.exit(1)
}
