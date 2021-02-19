import {LosslessNumber} from "lossless-json"

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

export interface CodeableConcept {
  coding: Array<Coding>
}

export interface Coding {
  system?: string
  code: string
  display?: string
  version?: string
}

export interface Reference<T extends Resource> {
  reference: string,
  display?: string
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
