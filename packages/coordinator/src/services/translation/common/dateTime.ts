
import moment from "moment"
import {hl7V3, processingErrors as errors} from "@models"

// eslint-disable-next-line max-len
const FHIR_DATE_REGEX = /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1]))?)?$/
// eslint-disable-next-line max-len
const FHIR_DATE_TIME_REGEX = /^([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)(-(0[1-9]|1[0-2])(-(0[1-9]|[1-2][0-9]|3[0-1])(T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]+)?(Z|([+-])((0[0-9]|1[0-3]):[0-5][0-9]|14:00)))?)?)?$/
const HL7_V3_DATE_FORMAT = "YYYYMMDD"
export const HL7_V3_DATE_TIME_FORMAT = "YYYYMMDDHHmmss"
export const ISO_DATE_FORMAT = "YYYY-MM-DD"
const ISO_DATE_TIME_FORMAT = "YYYY-MM-DD[T]HH:mm:ssZ"

export function convertIsoDateTimeStringToHl7V3DateTime(isoDateTimeStr: string, fhirPath: string): hl7V3.Timestamp {
  const dateTimeMoment = convertIsoDateTimeStringToMoment(isoDateTimeStr, fhirPath)
  return convertMomentToHl7V3DateTime(dateTimeMoment)
}

export function convertIsoDateTimeStringToHl7V3Date(isoDateStr: string, fhirPath: string): hl7V3.Timestamp {
  const dateTimeMoment = convertIsoDateTimeStringToMoment(isoDateStr, fhirPath)
  return convertMomentToHl7V3Date(dateTimeMoment)
}

export function convertIsoDateStringToHl7V3Date(isoDateStr: string, fhirPath: string): hl7V3.Timestamp {
  const dateTimeMoment = convertIsoDateStringToMoment(isoDateStr, fhirPath)
  return convertMomentToHl7V3Date(dateTimeMoment)
}

export function convertHL7V3DateTimeToIsoDateTimeString(hl7Date: hl7V3.Timestamp): string {
  const dateTimeMoment = convertHL7V3DateTimeToMoment(hl7Date)
  return convertMomentToISODateTime(dateTimeMoment)
}

export function convertHL7V3DateTimeToIsoDateString(hl7Date: hl7V3.Timestamp): string {
  const dateTimeMoment = convertHL7V3DateTimeToMoment(hl7Date)
  return convertMomentToISODate(dateTimeMoment)
}

export function convertHL7V3DateToIsoDateString(hl7Date: hl7V3.Timestamp): string {
  const dateTimeMoment = convertHL7V3DateToMoment(hl7Date)
  return convertMomentToISODate(dateTimeMoment)
}

export function convertHL7V3DateTimeStringToFhirDate(dateTimeString: string) {
  const dateTimeMoment = convertHL7V3DateTimeStringToMoment(dateTimeString)
  return convertMomentToISODate(dateTimeMoment)
}

export function convertHL7V3DateTimeStringToFhirDateTime(dateTimeString: string) {
  const dateTimeMoment = convertHL7V3DateTimeStringToMoment(dateTimeString)
  return convertMomentToISODateTime(dateTimeMoment)
}

function convertHL7V3DateTimeStringToMoment(hl7v3DateTimeString: string) {
  return moment.utc(hl7v3DateTimeString, HL7_V3_DATE_TIME_FORMAT)
}

function convertMomentToHl7V3Date(dateTime: moment.Moment): hl7V3.Timestamp {
  const hl7V3DateStr = dateTime.format(HL7_V3_DATE_FORMAT)
  return new hl7V3.Timestamp(hl7V3DateStr)
}

function convertHL7V3DateToMoment(hl7Date: hl7V3.Timestamp) {
  return moment.utc(hl7Date._attributes.value, HL7_V3_DATE_FORMAT)
}

export function convertMomentToHl7V3DateTime(dateTime: moment.Moment): hl7V3.Timestamp {
  const hl7V3DateTimeStr = dateTime.format(HL7_V3_DATE_TIME_FORMAT)
  return new hl7V3.Timestamp(hl7V3DateTimeStr)
}

function convertHL7V3DateTimeToMoment(hl7Date: hl7V3.Timestamp) {
  return moment.utc(hl7Date._attributes.value, HL7_V3_DATE_TIME_FORMAT)
}

function convertIsoDateTimeStringToMoment(isoDateTimeStr: string, fhirPath: string): moment.Moment {
  if (!FHIR_DATE_TIME_REGEX.test(isoDateTimeStr)) {
    throw new errors.InvalidValueError(`Incorrect format for date time string '${isoDateTimeStr}'.`, fhirPath)
  }
  return moment.utc(isoDateTimeStr, moment.ISO_8601, true)
}

function convertIsoDateStringToMoment(isoDateStr: string, fhirPath: string): moment.Moment {
  if (!FHIR_DATE_REGEX.test(isoDateStr)) {
    throw new errors.InvalidValueError(`Incorrect format for date string '${isoDateStr}'.`, fhirPath)
  }
  return moment.utc(isoDateStr, moment.ISO_8601, true)
}

export function convertMomentToISODate(moment: moment.Moment): string {
  return moment.format(ISO_DATE_FORMAT)
}

export function convertMomentToISODateTime(moment: moment.Moment): string {
  return moment.format(ISO_DATE_TIME_FORMAT)
}

export function isFutureDated(date: string): boolean {
  const provided = moment.utc(date)
  const now = moment.utc()
  return now.isBefore(provided)
}

export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  return (date.toISOString() > startDate.toISOString() &&
    date.toISOString() < endDate.toISOString()) ? true : false
}
