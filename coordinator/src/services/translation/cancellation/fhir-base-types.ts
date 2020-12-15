import * as fhir from "../../../models/fhir/fhir-resources"
import {getFullUrl} from "./common"

export function createIdentifier(system: string, value: string): fhir.Identifier {
  return {
    system: system,
    value: value
  }
}

export function createReference<T extends fhir.Resource>(reference: string): fhir.Reference<T> {
  return {
    reference: getFullUrl(reference)
  }
}
