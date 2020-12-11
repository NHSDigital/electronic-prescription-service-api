import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import * as fhir from "../../../models/fhir/fhir-resources"
import {toArray} from "../common"
import {InvalidValueError} from "../../../models/errors/processing-errors"
import * as uuid from "uuid"

export function convertName(hl7Name: Array<core.Name> | core.Name): Array<fhir.HumanName> {
  const nameArray = toArray(hl7Name)
  return nameArray.map(name => {
    let convertedName = {
      given: toArray(name.given).map(given => given._text),
      prefix: toArray(name.prefix).map(prefix => prefix._text)
    } as fhir.HumanName

    convertedName = name._attributes?.use
      ? {...convertedName, use: convertNameUse(name._attributes.use)}
      : convertedName

    convertedName = name.family?._text
      ? {...convertedName, family: name.family._text}
      : convertedName

    return convertedName
  })
}

function convertNameUse(hl7NameUse: string): string {
  switch (hl7NameUse) {
  case core.NameUse.USUAL:
    return "usual"
  case core.NameUse.ALIAS:
    return "temp"
  case core.NameUse.PREFERRED:
    return "nickname"
  case core.NameUse.PREVIOUS_BIRTH:
  case core.NameUse.PREVIOUS:
    return "old"
  case core.NameUse.PREVIOUS_BACHELOR:
  case core.NameUse.PREVIOUS_MAIDEN:
    return "maiden"
  default:
    throw new InvalidValueError(`Unhandled name use '${hl7NameUse}'.`)
  }
}

export function convertAddress(hl7Address: Array<core.Address> | core.Address): Array<fhir.Address> {
  const addressArray = toArray(hl7Address)
  return addressArray.map(address => {
    const convertedAddress = {
      line: address.streetAddressLine.map(addressLine => addressLine._text),
      postalCode: address.postalCode._text
    }
    return address._attributes?.use
      ? {...convertedAddress, use: convertAddressUse(address._attributes.use)}
      : convertedAddress
  })
}

function convertAddressUse(fhirAddressUse: core.AddressUse): string {
  switch (fhirAddressUse) {
  case core.AddressUse.HOME:
  case core.AddressUse.PRIMARY_HOME:
    return "home"
  case core.AddressUse.WORK:
  case core.AddressUse.BUSINESS:
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
  case core.TelecomUse.HOME:
    return "home"
  case core.TelecomUse.WORKPLACE:
    return "work"
  case core.TelecomUse.TEMPORARY:
    return "temp"
  case core.TelecomUse.MOBILE:
  case core.TelecomUse.PAGER:
    return "mobile"
  //TODO these are possible values, but we don'e know what to map them to
  // case core.TelecomUse.ANSWERING_MACHINE:
  // case core.TelecomUse.EMERGENCY_CONTACT:
  //   return "home+rank"
  default:
    throw new InvalidValueError(`Unhandled telecom use '${fhirTelecomUse}'.`)
  }
}

export function generateResourceId(): string {
  return uuid.v4().toString().toLowerCase()
}

export function getFullUrl(uuid: string):string {
  return `urn:uuid:${uuid}`
}
