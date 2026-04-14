import * as path from "node:path"

import {StructureDefinition} from "../models/fhir-package/structure-definition.interface.js"
import {parseSimplifierPackage} from "./parse-simplifier-package.js"

export function parseFhirSchema(outputPath: string, schemaFileName: string): StructureDefinition {
  const filePath = path.join(outputPath, "package", schemaFileName)
  return parseSimplifierPackage(filePath)
}
