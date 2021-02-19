import {getFullUrl} from "./common"
import * as fhir from "../../../models/fhir"

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

export function createCodeableConcept(system: string, code: string, display: string): fhir.CodeableConcept {
  return {
    coding: [{
      system: system,
      code: code,
      display: display
    }]
  }
}
