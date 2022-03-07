import path from "path"
import fs from "fs"
import * as fhir from "fhir/r4"

function readMessage<T extends fhir.Resource>(filename: string): T {
  const messagePath = path.join(__dirname, filename)
  const messageStr = fs.readFileSync(messagePath, "utf-8")
  return JSON.parse(messageStr)
}

export function readBundleFromFile(filename: string): fhir.Bundle {
  return readMessage<fhir.Bundle>(filename)
}

export function readClaimFromFile(filename: string): fhir.Claim {
  return readMessage<fhir.Claim>(filename)
}
