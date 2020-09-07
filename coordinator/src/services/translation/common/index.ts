import * as fhir from "../../../model/fhir-resources"
import moment from "moment"
import * as core from "../../../model/hl7-v3-datatypes-core"
import {SpineDirectResponse} from "../../spine-communication"
import {LosslessNumber} from "lossless-json"
import {InvalidValueUserFacingError, TooFewValuesUserFacingError, TooManyValuesUserFacingError} from "../../../error"

const FHIR_DATE_REGEX = /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$/
const FHIR_DATE_TIME_REGEX = /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?$/

export function onlyElement<T>(iterable: Iterable<T>, fhirPath: string, additionalContext?: string): T {
  const iterator = iterable[Symbol.iterator]()
  const first = iterator.next()
  if (first.done) {
    throw new TooFewValuesUserFacingError(`Too few values submitted. Expected 1 element${additionalContext ? " where " : ""}${additionalContext ? additionalContext : ""}.`, fhirPath)
  }
  const value = first.value
  if (!iterator.next().done) {
    throw new TooManyValuesUserFacingError(`Too many values submitted. Expected 1 element${additionalContext ? " where " : ""}${additionalContext ? additionalContext : ""}.`, fhirPath)
  }
  return value
}

export function onlyElementOrNull<T>(iterable: Iterable<T>, fhirPath: string, additionalContext?: string): T {
  const iterator = iterable[Symbol.iterator]()
  const value = iterator.next().value
  if (!iterator.next().done) {
    throw new TooManyValuesUserFacingError(`Too many values submitted. Expected at most 1 element${additionalContext ? " where " : ""}${additionalContext ? additionalContext : ""}.`, fhirPath)
  }
  return value
}

export function getResourceForFullUrl(fhirBundle: fhir.Bundle, resourceFullUrl: string): fhir.Resource {
  return onlyElement(
    fhirBundle.entry.filter(entry => entry.fullUrl === resourceFullUrl),
    "Bundle.entry",
    `fullUrl == '${resourceFullUrl}'`
  ).resource
}

export function resolveReference<T extends fhir.Resource>(bundle: fhir.Bundle, reference: fhir.Reference<T>): T {
  return getResourceForFullUrl(bundle, reference.reference) as T
}

export function getIdentifierValueForSystem(identifier: Array<fhir.Identifier>, system: string, fhirPath: string): string {
  return onlyElement(
    identifier.filter(identifier => identifier.system === system),
    fhirPath,
    `system == '${system}'`
  ).value
}

export function getIdentifierValueOrNullForSystem(identifier: Array<fhir.Identifier>, system: string, fhirPath: string): string {
  return onlyElementOrNull(
    identifier.filter(identifier => identifier.system === system),
    fhirPath,
    `system == '${system}'`
  )?.value
}

export function getCodingForSystem(coding: Array<fhir.Coding>, system: string, fhirPath: string): fhir.Coding {
  return onlyElement(
    coding.filter(coding => coding.system === system),
    fhirPath,
    `system == '${system}'`
  )
}

export function getExtensionForUrl(extensions: Array<fhir.Extension>, url: string, fhirPath: string): fhir.Extension {
  return onlyElement(
    extensions.filter(extension => extension.url === url),
    fhirPath,
    `url == '${url}'`
  )
}

export function getExtensionForUrlOrNull(extensions: Array<fhir.Extension>, url: string, fhirPath: string): fhir.Extension {
  return onlyElementOrNull(
    extensions.filter(extension => extension.url === url),
    fhirPath,
    `url == '${url}'`
  )
}

export function getCodeableConceptCodingForSystem(codeableConcept: Array<fhir.CodeableConcept>, system: string, fhirPath: string): fhir.Coding {
  const coding = codeableConcept.flatMap(codeableConcept => codeableConcept.coding)
  return getCodingForSystem(coding, system, fhirPath + ".coding")
}

export function convertMomentToDateTime(dateTime: moment.Moment): core.Timestamp {
  const hl7V3DateTimeStr = dateTime.format("YYYYMMDDHHmmss")
  return new core.Timestamp(hl7V3DateTimeStr)
}

export function convertIsoStringToDateTime(isoDateTimeStr: string, fhirPath: string): core.Timestamp {
  if (!FHIR_DATE_TIME_REGEX.test(isoDateTimeStr)) {
    throw new InvalidValueUserFacingError(`Incorrect format for date time string '${isoDateTimeStr}'.`, fhirPath)
  }
  const dateTime = moment.utc(isoDateTimeStr, moment.ISO_8601, true)
  return convertMomentToDateTime(dateTime)
}

export function convertMomentToDate(dateTime: moment.Moment): core.Timestamp {
  const hl7V3DateStr = dateTime.format("YYYYMMDD")
  return new core.Timestamp(hl7V3DateStr)
}

export function convertIsoStringToDate(isoDateStr: string, fhirPath: string): core.Timestamp {
  if (!FHIR_DATE_REGEX.test(isoDateStr)) {
    throw new InvalidValueUserFacingError(`Incorrect format for date string '${isoDateStr}'.`, fhirPath)
  }
  const dateTime = moment.utc(isoDateStr, moment.ISO_8601, true)
  return convertMomentToDate(dateTime)
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
