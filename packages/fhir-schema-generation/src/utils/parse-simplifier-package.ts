import * as fs from "node:fs"
import * as path from "node:path"
import {StructureDefinition} from "../models/fhir-package/structure-definition.interface.js"

/**
 * Reads a JSON Schema file produced by the Simplifier package and returns
 * its definitions types
 *
 * @param directory Root directory of the extracted Simplifier package.
 * @param filePath Filename inside the `openapi/` subdirectory (for example "MedicationRequest.schema.json").
 */
export function parseSimplifierPackage(
  filePath: string
): StructureDefinition {
  // console.log(`Parsing schema: ${filePath}`)

  const rawFile = fs.readFileSync(filePath, "utf-8")
  const parsedJson: unknown = JSON.parse(rawFile)

  return parsedJson as StructureDefinition
}

/**
 * Asynchronously gets all files in a folder that start with a specific prefix.
 *
 * @param folderPath - The directory to search.
 * @param prefix - The prefix the files should start with.
 * @returns A promise that resolves to an array of matching file paths.
 */
export async function getSimplifierDefinitionFiles(folderPath: string, prefix: string): Promise<Array<string>> {
  try {
    // Read the directory contents, returning fs.Dirent objects
    // console.log(`Searching directory "${folderPath} with prefix: "${prefix}"`)
    const items = await fs.readdirSync(folderPath, {withFileTypes: true})

    const matchedFiles: Array<string> = []

    // console.log(`Found ${items.length}`)
    for (const item of items) {
      // Check if it's a file and starts with the prefix
      if (item.isFile() && item.name.startsWith(prefix)) {
        // Store the full path (or just push item.name if you only want the filename)
        matchedFiles.push(path.join(folderPath, item.name))
      }
    }

    return matchedFiles
  } catch (error) {
    console.error(`Error reading directory: ${error}`)
    throw error
  }
}
