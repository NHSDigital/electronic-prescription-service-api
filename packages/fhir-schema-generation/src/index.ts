import {downloadSimplifierPackage} from "./utils/fetch-fhir.js"

console.log("Starting application initialization...")

try {
  const registryUrl: string = "https://packages.simplifier.net"
  const packageName: string = "hl7.fhir.r4.core"
  const version = "latest"

  await downloadSimplifierPackage(registryUrl, packageName, version)
  console.log("Generation complete")
} catch (error) {
  console.error("Application failed to start:", error)
  process.exit(1)
}
