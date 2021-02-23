import {LosslessNumber} from "lossless-json"
import {getFullUrl} from "../../services/translation/response/common"

export abstract class Resource {
  id?: string
  meta?: Meta
  resourceType: string
}

export interface Meta {
  lastUpdated: string
}

export interface Identifier {
  use?: string
  system?: string
  value?: string
}

export function createIdentifier(system: string, value: string): Identifier {
  return {
    system: system,
    value: value
  }
}

export interface CodeableConcept {
  coding: Array<Coding>
}

export function createCodeableConcept(system: string, code: string, display: string): CodeableConcept {
  return {
    coding: [createCoding(system, code, display)]
  }
}

export interface Coding {
  system?: string
  code: string
  display?: string
  version?: string
}

export function createCoding(system: string, code: string, display: string): Coding {
  return {
    system, code, display
  }
}

export interface Reference<T extends Resource> {
  reference: string,
  display?: string
}

export function createReference<T extends Resource>(reference: string): Reference<T> {
  return {
    reference: getFullUrl(reference)
  }
}

export interface IdentifierReference<T extends Resource> {
  identifier: Identifier,
  display?: string
}

export interface SimpleQuantity {
  value: string | LosslessNumber
  unit: string
  system?: string
  code: string
}

export interface Period {
  start?: string
  end?: string
}
