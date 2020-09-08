import * as fhir from "../../../model/fhir-resources"
import moment from "moment"
import * as core from "../../../model/hl7-v3-datatypes-core"
import {SpineDirectResponse} from "../../spine-communication"
import {LosslessNumber} from "lossless-json"

const FHIR_DATE_REGEX = /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$/
const FHIR_DATE_TIME_REGEX = /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?$/

export function getResourceForFullUrl(fhirBundle: fhir.Bundle, resourceFullUrl: string): fhir.Resource {
  return fhirBundle.entry
    .filter(entry => entry.fullUrl === resourceFullUrl)
    .reduce(onlyElement)
    .resource
}

export function resolveReference<T extends fhir.Resource>(bundle: fhir.Bundle, reference: fhir.Reference<T>): T {
  return getResourceForFullUrl(bundle, reference.reference) as T
}

export function getIdentifierValueForSystem(identifier: Array<fhir.Identifier>, system: string): string {
  return identifier
    .filter(identifier => identifier.system === system)
    .reduce(onlyElement)
    .value
}

export function getIdentifierValueOrNullForSystem(identifier: Array<fhir.Identifier>, system: string): string {
  const filtered = identifier
    .filter(identifier => identifier.system === system)
    .map(identifier => identifier.value)
  if (filtered.length > 1) throw TypeError(`Expected 1 or less elements but got ${filtered.length}: ${JSON.stringify(filtered)}`)
  return filtered.shift()
}

export function getCodingForSystem(coding: Array<fhir.Coding>, system: string): fhir.Coding {
  return coding
    .filter(coding => coding.system === system)
    .reduce(onlyElement)
}

export function getExtensionForUrl(extensions: Array<fhir.Extension>, url: string): fhir.Extension {
  return extensions
    .filter(extension => extension.url === url)
    .reduce(onlyElement)
}

export function getExtensionForUrlOrNull(extensions: Array<fhir.Extension>, url: string): fhir.Extension {
  const filtered = extensions
    .filter(extension => extension.url === url)
  if (filtered.length > 1) throw TypeError(`Expected 1 or less elements but got ${filtered.length}: ${JSON.stringify(filtered)}`)
  return filtered.shift()
}

export function getCodeableConceptCodingForSystem(codeableConcept: Array<fhir.CodeableConcept>, system: string): fhir.Coding {
  const coding = codeableConcept
    .flatMap(codeableConcept => codeableConcept.coding)
  return getCodingForSystem(coding, system)
}

export function convertIsoStringToHl7V3DateTime(isoDateTimeStr: string): core.Timestamp {
  const dateTimeMoment = convertIsoDateTimeStringToMoment(isoDateTimeStr)
  return convertMomentToHl7V3DateTime(dateTimeMoment)
}

export function convertIsoDateTimeStringToMoment(isoDateTimeStr: string): moment.Moment {
  if (!FHIR_DATE_TIME_REGEX.test(isoDateTimeStr)) {
    throw new TypeError(`Incorrect format for date time string ${isoDateTimeStr}`)
  }
  return moment.utc(isoDateTimeStr, moment.ISO_8601, true)
}

export function convertMomentToHl7V3DateTime(dateTime: moment.Moment): core.Timestamp {
  const hl7V3DateTimeStr = dateTime.format("YYYYMMDDHHmmss")
  return new core.Timestamp(hl7V3DateTimeStr)
}

export function convertIsoStringToHl7V3Date(isoDateStr: string): core.Timestamp {
  const dateTimeMoment = convertIsoDateStringToMoment(isoDateStr)
  return convertMomentToHl7V3Date(dateTimeMoment)
}

export function convertIsoDateStringToMoment(isoDateStr: string): moment.Moment {
  if (!FHIR_DATE_REGEX.test(isoDateStr)) {
    throw new TypeError(`Incorrect format for date string ${isoDateStr}`)
  }
  return moment.utc(isoDateStr, moment.ISO_8601, true)
}

export function convertMomentToHl7V3Date(dateTime: moment.Moment): core.Timestamp {
  const hl7V3DateStr = dateTime.format("YYYYMMDD")
  return new core.Timestamp(hl7V3DateStr)
}

//TODO - replace usage of this method with something which returns more user-friendly error messages
export function onlyElement<T>(previousValue: T, currentValue: T, currentIndex: number, array: Array<T>): never {
  throw TypeError("Expected 1 element but got " + array.length + ": " + JSON.stringify(array))
}

export function wrapInOperationOutcome(message: SpineDirectResponse): fhir.OperationOutcome {
  return {
    resourceType: "OperationOutcome",
    issue: [{
      code: message.statusCode <= 299 ? "informational" : "invalid",
      severity: message.statusCode <= 299 ? "information" : "error",
      diagnostics: message.body
    }]
  }
}

export function getNumericValueAsString(numericValue: string | number | LosslessNumber): string {
  if (typeof numericValue === "number") {
    throw new TypeError("Got a number but expected a LosslessNumber. Use LosslessJson.parse() instead of JSON.parse() or precision may be lost.")
  } else if (typeof numericValue === "string") {
    return numericValue
  } else {
    return numericValue.toString()
  }
}

export function getNumericValueAsNumber(numericValue: string | number | LosslessNumber): number {
  if (typeof numericValue === "number") {
    throw new TypeError("Got a number but expected a LosslessNumber. Use LosslessJson.parse() instead of JSON.parse() or precision may be lost.")
  } else if (typeof numericValue === "string") {
    return new LosslessNumber(numericValue).valueOf()
  } else {
    return numericValue.valueOf()
  }
}

