import * as fhir from "../../../models/fhir/fhir-resources"
import moment from "moment"
import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import {SpineDirectResponse} from "../../../models/spine"
import {LosslessNumber} from "lossless-json"
import {InvalidValueError, TooFewValuesError, TooManyValuesError} from "../../../models/errors/processing-errors"
import {readXml} from "../../serialisation/xml"
import {AsyncMCCI, SyncMCCI} from "../../../models/hl7-v3/hl7-v3-spine-response"

// eslint-disable-next-line max-len
const FHIR_DATE_REGEX = /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$/
// eslint-disable-next-line max-len
const FHIR_DATE_TIME_REGEX = /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?$/
const SYNC_SPINE_RESPONSE_MCCI_REGEX = /(<MCCI_IN010000UK13>)([\s\S]*)(<\/MCCI_IN010000UK13>)/i
const ASYNC_SPINE_RESPONSE_MCCI_REGEX = /(<hl7:MCCI_IN010000UK13[\s\S]*>)([\s\S]*)(<\/hl7:MCCI_IN010000UK13>)/i

export function onlyElement<T>(iterable: Iterable<T>, fhirPath: string, additionalContext?: string): T {
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
  identifier: Array<fhir.Identifier>,
  system: string,
  fhirPath: string
): string {
  return onlyElement(
    identifier.filter(identifier => identifier.system === system),
    fhirPath,
    `system == '${system}'`
  ).value
}

export function getIdentifierValueOrNullForSystem(
  identifier: Array<fhir.Identifier>,
  system: string,
  fhirPath: string
): string {
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

export function getCodingForSystemOrNull(coding: Array<fhir.Coding>, system: string, fhirPath: string): fhir.Coding {
  return onlyElementOrNull(
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
  codeableConcept: Array<fhir.CodeableConcept>,
  system: string,
  fhirPath: string
): fhir.Coding {
  const coding = codeableConcept.flatMap(codeableConcept => codeableConcept.coding)
  return getCodingForSystem(coding, system, fhirPath + ".coding")
}

export function getCodeableConceptCodingForSystemOrNull(
  codeableConcept: Array<fhir.CodeableConcept>,
  system: string,
  fhirPath: string
): fhir.Coding {
  const coding = codeableConcept.flatMap(codeableConcept => codeableConcept.coding)
  return getCodingForSystemOrNull(coding, system, fhirPath + ".coding")
}

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

export function convertIsoDateTimeStringToMoment(isoDateTimeStr: string, fhirPath: string): moment.Moment {
  if (!FHIR_DATE_TIME_REGEX.test(isoDateTimeStr)) {
    throw new InvalidValueError(`Incorrect format for date time string '${isoDateTimeStr}'.`, fhirPath)
  }
  return moment.utc(isoDateTimeStr, moment.ISO_8601, true)
}

export function convertIsoDateStringToMoment(isoDateStr: string, fhirPath: string): moment.Moment {
  if (!FHIR_DATE_REGEX.test(isoDateStr)) {
    throw new InvalidValueError(`Incorrect format for date string '${isoDateStr}'.`, fhirPath)
  }
  return moment.utc(isoDateStr, moment.ISO_8601, true)
}

export function convertMomentToHl7V3Date(dateTime: moment.Moment): core.Timestamp {
  const hl7V3DateStr = dateTime.format("YYYYMMDD")
  return new core.Timestamp(hl7V3DateStr)
}

export function convertMomentToHl7V3DateTime(dateTime: moment.Moment): core.Timestamp {
  const hl7V3DateTimeStr = dateTime.format("YYYYMMDDHHmmss")
  return new core.Timestamp(hl7V3DateTimeStr)
}

function toArray<T>(thing: T | Array<T>): Array<T> {
  return Array.isArray(thing) ? thing : [thing]
}

function translateSyncSpineResponse(message: string): Array<fhir.CodeableConcept> {
  const parsedMsg = readXml(message) as SyncMCCI
  const acknowledgementDetailElm = parsedMsg.MCCI_IN010000UK13.acknowledgement.acknowledgementDetail
  const acknowledgementDetailArray = toArray(acknowledgementDetailElm)
  return acknowledgementDetailArray.map(acknowledgementDetail => {
    return {
      coding: [{
        code: acknowledgementDetail.code._attributes.code,
        display: acknowledgementDetail.code._attributes.displayName,
        system: ""
      }]
    }
  })
}

function translateAsyncSpineResponse(message: string): Array<fhir.CodeableConcept> {
  const parsedMsg = readXml(message) as AsyncMCCI
  const reasonElm = parsedMsg["hl7:MCCI_IN010000UK13"]["hl7:ControlActEvent"]["hl7:reason"]
  const reasonArray = toArray(reasonElm)
  return reasonArray.map(reason => ({
    coding: [{
      code: reason["hl7:justifyingDetectedIssueEvent"]["hl7:code"]._attributes.code,
      display: reason["hl7:justifyingDetectedIssueEvent"]["hl7:code"]._attributes.displayName,
      system: ""
    }]
  }))
}

export function translateToOperationOutcome<T>(message: SpineDirectResponse<T>): fhir.OperationOutcome {
  if (message.statusCode <= 299) {
    return {
      resourceType: "OperationOutcome",
      issue: [{
        code: "informational",
        severity: "information",
        diagnostics: message.body?.toString()
      }]
    }
  }

  const bodyString = message.body.toString()
  const syncMCCI = SYNC_SPINE_RESPONSE_MCCI_REGEX.exec(bodyString)
  const asyncMCCI = ASYNC_SPINE_RESPONSE_MCCI_REGEX.exec(bodyString)
  let codeableConceptArray: Array<fhir.CodeableConcept> = []
  if (syncMCCI) {
    codeableConceptArray = translateSyncSpineResponse(syncMCCI[0])
  } else if (asyncMCCI) {
    codeableConceptArray = translateAsyncSpineResponse(asyncMCCI[0])
  } else {
    return {
      resourceType: "OperationOutcome",
      issue: [{
        code:"invalid",
        severity: "error",
        diagnostics: message.body?.toString()
      }]
    }
  }
  return {
    resourceType: "OperationOutcome",
    issue: codeableConceptArray.map(codeableConcept => ({
      code:"invalid",
      severity: "error",
      diagnostics: message.body?.toString(),
      details: codeableConcept
    }))
  }
}

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
