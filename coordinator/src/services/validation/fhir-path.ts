import {Bundle, Extension, Reference, Resource} from "../../models/fhir/fhir-resources"
import {resolveReference} from "../translation/common"

/**
 * Implementation of simple FHIR paths
 * See https://www.hl7.org/fhir/fhirpath.html#simple
 */

export function applyFhirPath(bundle: Bundle, input: Array<unknown>, path: string): Array<unknown> {
  const pathElements = splitFhirPath(path)
  return pathElements.reduce(
    (output, pathElement) => applyFhirPathElement(bundle, output, pathElement),
    input
  )
}

function splitFhirPath(path: string) {
  const pathElements = []
  let inQuotes = false
  let currentPathElement = ""
  for (const char of path) {
    if (char === "." && !inQuotes) {
      // Start a new path element
      if (currentPathElement) {
        pathElements.push(currentPathElement)
      }
      currentPathElement = ""
    } else {
      // Append to the existing path element
      if (char === "\"") {
        inQuotes = !inQuotes
      }
      currentPathElement += char
    }
  }
  if (currentPathElement) {
    pathElements.push(currentPathElement)
  }
  return pathElements
}

function applyFhirPathElement(bundle: Bundle, input: Array<unknown>, pathElement: string): Array<unknown> {
  if (pathElement === "resolve()") {
    const references = input as Array<Reference<Resource>>
    return references.map(i => resolveReference(bundle, i))
  }

  const records = input as Array<Record<string, unknown>>
  const extensionMatch = pathElement.match(/extension\("(.*)"\)/)
  if (extensionMatch) {
    return records.flatMap(i => i.extension as Array<Extension>)
      .filter(extension => extension.url === extensionMatch[1])
  }

  const ofTypeMatch = pathElement.match(/ofType\((.*)\)/)
  if (ofTypeMatch) {
    return records.filter(i => i.resourceType === ofTypeMatch[1])
  }

  return records.flatMap(i => i[pathElement])
}
