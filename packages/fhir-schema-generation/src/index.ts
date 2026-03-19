import path from "path"
import {normalizeFileName} from "./utils/common.js"
import {downloadSimplifierPackage} from "./utils/download-simplifier-package.js"
import {generateSchema} from "./utils/generate-schema.js"

async function main() {
  try {
    console.log("Starting application initialization...")

    const registryUrl: string = `https://packages.simplifier.net`
    const packageName: string = "hl7.fhir.r4.core"
    const version = "latest"

    const outputPath = path.join(process.cwd(), ".output", "parsed", normalizeFileName(`${packageName}-${version}`))

    await downloadSimplifierPackage(registryUrl, packageName, outputPath, version)
    await generateSchema(outputPath)
  } catch (error) {
    console.error("Application failed to start:", error)
    process.exit(1)
  }

  console.log("Generation complete")
}

// Execute the entry point
main()
