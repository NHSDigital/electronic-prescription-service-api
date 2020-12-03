import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import * as fhir from "../../../models/fhir/fhir-resources"
import {toArray} from "../common"
import {InvalidValueError} from "../../../models/errors/processing-errors"
import moment from "moment"

export function convertName(hl7Name: Array<core.Name> | core.Name): Array<fhir.HumanName> {
  const nameArray = toArray(hl7Name)
  return nameArray.map(name => {
    return name._attributes?.use ? {
      use: convertNameUse(name._attributes.use),
      family: name.family._text,
      given: toArray(name.given).map(given => given._text),
      prefix: toArray(name.prefix).map(prefix => prefix._text)
    } : {
      family: name.family._text,
      given: toArray(name.given).map(given => given._text),
      prefix: toArray(name.prefix).map(prefix => prefix._text)
    }
  })
}

function convertNameUse(hl7NameUse: string): string {
  switch (hl7NameUse) {
  //TODO NameUse.USUAL could be either "usual" or "official", how do we tell?
  case core.NameUse.USUAL:
    //case "usual":
    return "official"
    //TODO NameUse.PREFERRED could be either "temp" or "anonymous", how do we tell?
  case core.NameUse.ALIAS:
    //case "anonymous":
    return "temp"
  case core.NameUse.PREFERRED:
    return "nickname"
  case core.NameUse.PREVIOUS:
    return "old"
  case core.NameUse.PREVIOUS_MAIDEN:
    return "maiden"
  default:
    throw new InvalidValueError(`Unhandled name use '${hl7NameUse}'.`)
  }
}

export function convertAddress(hl7Address: Array<core.Address> | core.Address): Array<fhir.Address> {
  const addressArray = toArray(hl7Address)
  return addressArray.map(address => {
    return address._attributes?.use ? {
      use: convertAddressUse(address._attributes.use),
      line: address.streetAddressLine.map(addressLine => addressLine._text),
      postalCode: address.postalCode._text
    } : {
      line: address.streetAddressLine.map(addressLine => addressLine._text),
      postalCode: address.postalCode._text
    }
  })
}

function convertAddressUse(fhirAddressUse: core.AddressUse): string {
  switch (fhirAddressUse) {
  case core.AddressUse.HOME:
    return "home"
  case core.AddressUse.WORK:
    return "work"
  case core.AddressUse.TEMPORARY:
    return "temp"
  case core.AddressUse.POSTAL:
    return "billing"
  case undefined:
    return undefined
  default:
    throw new InvalidValueError(`Unhandled address use '${fhirAddressUse}'.`)
  }
}

export function convertTelecom(telecom: Array<core.Telecom> | core.Telecom): Array<fhir.ContactPoint> {
  const telecomArray = toArray(telecom)
  return telecomArray.map(value => ({
    system: "phone",
    value: value._attributes.value.split(":")[1],
    use: convertTelecomUse(value._attributes.use)
  }))
}

function convertTelecomUse(fhirTelecomUse: string): string {
  switch (fhirTelecomUse) {
  case core.TelecomUse.PERMANENT_HOME:
    return "home"
  case core.TelecomUse.WORKPLACE:
    return "work"
  case core.TelecomUse.TEMPORARY:
    return "temp"
  case core.TelecomUse.MOBILE:
    return "mobile"
  default:
    throw new InvalidValueError(`Unhandled telecom use '${fhirTelecomUse}'.`)
  }
}

function convertHL7V3DateTimeToMoment(hl7Date: string) {
  return moment(hl7Date, "YYYYMMDDhhmmss")
}

function convertMomentToISODateTime(moment: moment.Moment): string {
  return moment.format("YYYY-MM-DD[T]hh:mm:ssZ")
}

export function convertHL7V3DateTimeStringToISODateTime(hl7Date: string): string {
  const dateTimeMoment = convertHL7V3DateTimeToMoment(hl7Date)
  return convertMomentToISODateTime(dateTimeMoment)
}
