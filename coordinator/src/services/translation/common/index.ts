import * as fhir from "../../../models/fhir/fhir-resources"
import moment from "moment"
import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import {LosslessNumber} from "lossless-json"
import {InvalidValueError, TooFewValuesError, TooManyValuesError} from "../../../models/errors/processing-errors"

// eslint-disable-next-line max-len
const FHIR_DATE_REGEX = /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$/
// eslint-disable-next-line max-len
const FHIR_DATE_TIME_REGEX = /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|([+-])((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?$/

export const UNKNOWN_GP_ODS_CODE = "V81999"

export function onlyElement<T>(iterable: Iterable<T>, fhirPath: string, additionalContext?: string): T {
  if (!iterable) {
    throw new InvalidValueError("Required field missing.", fhirPath)
  }
  const iterator = iterable[Symbol.iterator]()
  const first = iterator.next()
  if (first.done) {
    throw new TooFewValuesError(`Too few values submitted. Expected 1 element${
      additionalContext ? " where " : ""
    }${
      additionalContext ? additionalContext : ""
    }.`, fhirPath)
  }
  const value = first.value
  if (!iterator.next().done) {
    throw new TooManyValuesError(`Too many values submitted. Expected 1 element${
      additionalContext ? " where " : ""
    }${
      additionalContext ? additionalContext : ""
    }.`, fhirPath)
  }
  return value
}

export function onlyElementOrNull<T>(iterable: Iterable<T>, fhirPath: string, additionalContext?: string): T {
  if (!iterable) {
    return null
  }
  const iterator = iterable[Symbol.iterator]()
  const value = iterator.next().value
  if (!iterator.next().done) {
    throw new TooManyValuesError(`Too many values submitted. Expected at most 1 element${
      additionalContext ? " where " : ""
    }${
      additionalContext ? additionalContext : ""
    }.`, fhirPath)
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

export function getIdentifierValueForSystem(
  identifiers: Array<fhir.Identifier>,
  system: string,
  fhirPath: string
): string {
  if (!identifiers) {
    throw new InvalidValueError("Required field missing.", fhirPath)
  }
  return onlyElement(
    identifiers.filter(identifier => identifier.system === system),
    fhirPath,
    `system == '${system}'`
  ).value
}

export function getIdentifierValueOrNullForSystem(
  identifiers: Array<fhir.Identifier>,
  system: string,
  fhirPath: string
): string {
  if (!identifiers) {
    return null
  }
  return onlyElementOrNull(
    identifiers.filter(identifier => identifier.system === system),
    fhirPath,
    `system == '${system}'`
  )?.value
}

export function getCodingForSystem(codings: Array<fhir.Coding>, system: string, fhirPath: string): fhir.Coding {
  return onlyElement(
    codings.filter(coding => coding.system === system),
    fhirPath,
    `system == '${system}'`
  )
}

export function getCodingForSystemOrNull(codings: Array<fhir.Coding>, system: string, fhirPath: string): fhir.Coding {
  return onlyElementOrNull(
    codings.filter(coding => coding.system === system),
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

export function getExtensionForUrlOrNull(
  extensions: Array<fhir.Extension>,
  url: string,
  fhirPath: string
): fhir.Extension {
  return onlyElementOrNull(
    extensions.filter(extension => extension.url === url),
    fhirPath,
    `url == '${url}'`
  )
}

export function getCodeableConceptCodingForSystem(
  codeableConcepts: Array<fhir.CodeableConcept>,
  system: string,
  fhirPath: string
): fhir.Coding {
  if (!codeableConcepts) {
    throw new InvalidValueError("Required field missing.", fhirPath)
  }
  const coding = codeableConcepts.flatMap(codeableConcept => codeableConcept.coding)
  return getCodingForSystem(coding, system, fhirPath + ".coding")
}

export function getCodeableConceptCodingForSystemOrNull(
  codeableConcepts: Array<fhir.CodeableConcept>,
  system: string,
  fhirPath: string
): fhir.Coding {
  if (!codeableConcepts) {
    return null
  }
  const coding = codeableConcepts.flatMap(codeableConcept => codeableConcept.coding)
  return getCodingForSystemOrNull(coding, system, fhirPath + ".coding")
}

export function toArray<T>(thing: T | Array<T>): Array<T> {
  return Array.isArray(thing) ? thing : [thing]
}

export const isTruthy = Boolean

export function getNumericValueAsString(numericValue: string | number | LosslessNumber): string {
  if (typeof numericValue === "number") {
    throw new TypeError(
      "Got a number but expected a LosslessNumber." +
      " Use LosslessJson.parse() instead of JSON.parse() or precision may be lost."
    )
  } else if (typeof numericValue === "string") {
    return numericValue
  } else {
    return numericValue.toString()
  }
}

const HL7_V3_DATE_FORMAT = "YYYYMMDD"
const HL7_V3_DATE_TIME_FORMAT = "YYYYMMDDHHmmss"
const ISO_DATE_FORMAT = "YYYY-MM-DD"
const ISO_DATE_TIME_FORMAT = "YYYY-MM-DD[T]HH:mm:ssZ"

export function convertIsoDateTimeStringToHl7V3DateTime(isoDateTimeStr: string, fhirPath: string): core.Timestamp {
  const dateTimeMoment = convertIsoDateTimeStringToMoment(isoDateTimeStr, fhirPath)
  return convertMomentToHl7V3DateTime(dateTimeMoment)
}

export function convertIsoDateTimeStringToHl7V3Date(isoDateStr: string, fhirPath: string): core.Timestamp {
  const dateTimeMoment = convertIsoDateTimeStringToMoment(isoDateStr, fhirPath)
  return convertMomentToHl7V3Date(dateTimeMoment)
}

export function convertIsoDateStringToHl7V3Date(isoDateStr: string, fhirPath: string): core.Timestamp {
  const dateTimeMoment = convertIsoDateStringToMoment(isoDateStr, fhirPath)
  return convertMomentToHl7V3Date(dateTimeMoment)
}

export function convertHL7V3DateTimeToIsoDateTimeString(hl7Date: core.Timestamp): string {
  const dateTimeMoment = convertHL7V3DateTimeToMoment(hl7Date)
  return convertMomentToISODateTime(dateTimeMoment)
}

export function convertHL7V3DateToIsoDateString(hl7Date: core.Timestamp): string {
  const dateTimeMoment = convertHL7V3DateToMoment(hl7Date)
  return convertMomentToISODate(dateTimeMoment)
}

function convertMomentToHl7V3Date(dateTime: moment.Moment): core.Timestamp {
  const hl7V3DateStr = dateTime.format(HL7_V3_DATE_FORMAT)
  return new core.Timestamp(hl7V3DateStr)
}

function convertHL7V3DateToMoment(hl7Date: core.Timestamp) {
  return moment.utc(hl7Date._attributes.value, HL7_V3_DATE_FORMAT)
}

export function convertMomentToHl7V3DateTime(dateTime: moment.Moment): core.Timestamp {
  const hl7V3DateTimeStr = dateTime.format(HL7_V3_DATE_TIME_FORMAT)
  return new core.Timestamp(hl7V3DateTimeStr)
}

function convertHL7V3DateTimeToMoment(hl7Date: core.Timestamp) {
  return moment.utc(hl7Date._attributes.value, HL7_V3_DATE_TIME_FORMAT)
}

function convertIsoDateTimeStringToMoment(isoDateTimeStr: string, fhirPath: string): moment.Moment {
  if (!FHIR_DATE_TIME_REGEX.test(isoDateTimeStr)) {
    throw new InvalidValueError(`Incorrect format for date time string '${isoDateTimeStr}'.`, fhirPath)
  }
  return moment.utc(isoDateTimeStr, moment.ISO_8601, true)
}

export function convertMomentToISODateTime(moment: moment.Moment): string {
  return moment.format(ISO_DATE_TIME_FORMAT)
}

function convertIsoDateStringToMoment(isoDateStr: string, fhirPath: string): moment.Moment {
  if (!FHIR_DATE_REGEX.test(isoDateStr)) {
    throw new InvalidValueError(`Incorrect format for date string '${isoDateStr}'.`, fhirPath)
  }
  return moment.utc(isoDateStr, moment.ISO_8601, true)
}

function convertMomentToISODate(moment: moment.Moment): string {
  return moment.format(ISO_DATE_FORMAT)
}

function isStringParameter(parameter: fhir.Parameter): parameter is fhir.StringParameter {
  return (parameter as fhir.StringParameter).valueString !== undefined
}

function isIdentifierParameter(parameter: fhir.Parameter): parameter is fhir.IdentifierParameter {
  return (parameter as fhir.IdentifierParameter).valueIdentifier !== undefined
}

export function getStringParameterByName(
  parameters: Array<fhir.ParameterTypes>,
  name: string,
  fhirPath = ""
): fhir.StringParameter {
  return onlyElement(parameters
    .filter(parameter => isStringParameter(parameter))
    .filter(parameter => parameter.name === name), fhirPath, `name == '${name}'`) as fhir.StringParameter
}

export function getIdentifierParameterByName(
  parameters: Array<fhir.ParameterTypes>,
  name: string,
  fhirPath = ""
): fhir.IdentifierParameter {
  return onlyElement(parameters
    .filter(parameter => isIdentifierParameter(parameter))
    .filter(parameter => parameter.name === name), fhirPath, `name == '${name}'`) as fhir.IdentifierParameter
}
