import {Bundle, Extension, Reference, Resource} from "../../models/fhir/fhir-resources"
import {resolveReference} from "../translation/common"

/**
 * Implementation of simple FHIR paths
 * See https://www.hl7.org/fhir/fhirpath.html#simple
 */

const FHIR_PATH_MATCHER = /("[^"]*"|[^".]+)+/g
const EXTENSION_MATCHER = /extension\("(\S+)"\)/
const OF_TYPE_MATCHER = /ofType\((\S+)\)/

export function applyFhirPath(bundle: Bundle, input: Array<unknown>, path: string): Array<unknown> {
  const pathElements = splitFhirPath(path)
  return pathElements.reduce(
    (previousOutput, nextPathElement) => applyFhirPathElement(bundle, previousOutput, nextPathElement),
    input
  )
}

function splitFhirPath(path: string) {
  FHIR_PATH_MATCHER.lastIndex = 0
  const result = []
  let match = FHIR_PATH_MATCHER.exec(path)
  while (match !== null) {
    result.push(match[0])
    match = FHIR_PATH_MATCHER.exec(path)
  }
  return result
}

function applyFhirPathElement(bundle: Bundle, input: Array<unknown>, pathElement: string): Array<unknown> {
  if (pathElement === "resolve()") {
    const references = input as Array<Reference<Resource>>
    return references.map(i => resolveReference(bundle, i))
  }

  const records = input as Array<Record<string, unknown>>
  const extensionMatch = EXTENSION_MATCHER.exec(pathElement)
  if (extensionMatch) {
    return records.flatMap(i => i.extension as Array<Extension>)
      .filter(extension => extension.url === extensionMatch[1])
  }

  const ofTypeMatch = OF_TYPE_MATCHER.exec(pathElement)
  if (ofTypeMatch) {
    return records.filter(i => i.resourceType === ofTypeMatch[1])
  }

  return records.flatMap(i => i[pathElement])
}
