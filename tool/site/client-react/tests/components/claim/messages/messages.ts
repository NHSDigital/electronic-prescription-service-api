import path from "path"
import fs from "fs"
import * as fhir from "fhir/r4"

export function readMessage(filename: string): fhir.Bundle {
  const messagePath = path.join(__dirname, filename)
  const messageStr = fs.readFileSync(messagePath, "utf-8")
  return JSON.parse(messageStr)
}
