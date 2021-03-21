import {InvalidValueError} from "../../../models/errors/processing-errors"
import {isTruthy} from "../common"
import * as hl7V3 from "../../../models/hl7-v3"
import {fhir} from "@models"

export function convertName(humanName: fhir.HumanName, fhirPath: string): hl7V3.Name {
  const name = new hl7V3.Name()
  if (humanName.use) {
    name._attributes = {
      use: convertNameUse(humanName.use, fhirPath)
    }
  }
  if (humanName.prefix) {
    name.prefix = humanName.prefix.map(prefix => new hl7V3.Text(prefix))
  }
  if (humanName.given) {
    name.given = humanName.given.map(given => new hl7V3.Text(given))
  }
  if (humanName.family) {
    name.family = new hl7V3.Text(humanName.family)
  }
  if (humanName.suffix) {
    name.suffix = humanName.suffix.map(suffix => new hl7V3.Text(suffix))
  }
  return name
}

function convertNameUse(fhirNameUse: string, fhirPath: string) {
  switch (fhirNameUse) {
    case "usual":
    case "official":
      return hl7V3.NameUse.USUAL
    case "temp":
    case "anonymous":
      return hl7V3.NameUse.ALIAS
    case "nickname":
      return hl7V3.NameUse.PREFERRED
    case "old":
      return hl7V3.NameUse.PREVIOUS
    case "maiden":
      return hl7V3.NameUse.PREVIOUS_MAIDEN
    default:
      throw new InvalidValueError(`Unhandled name use '${fhirNameUse}'.`, fhirPath + ".use")
  }
}

export function convertTelecom(contactPoint: fhir.ContactPoint, fhirPath: string): hl7V3.Telecom {
  const telecom = new hl7V3.Telecom()
  if (contactPoint.use) {
    telecom._attributes = {
      use: convertTelecomUse(contactPoint.use, fhirPath)
    }
  }
  if (contactPoint.value) {
    telecom._attributes = {
      ...telecom._attributes,
      value: convertTelecomValue(contactPoint.value)
    }
  }
  return telecom
}

function convertTelecomUse(fhirTelecomUse: string, fhirPath: string) {
  switch (fhirTelecomUse) {
    case "home":
      return hl7V3.TelecomUse.PERMANENT_HOME
    case "work":
      return hl7V3.TelecomUse.WORKPLACE
    case "temp":
      return hl7V3.TelecomUse.TEMPORARY
    case "mobile":
      return hl7V3.TelecomUse.MOBILE
    default:
      throw new InvalidValueError(`Unhandled telecom use '${fhirTelecomUse}'.`, fhirPath + ".use")
  }
}

function convertTelecomValue(value: string) {
  value = value.replace(/\s/g, "")
  //TODO - what if system is not "phone", e.g. should an email address be prefixed with "mailto:" instead?
  if (!value.startsWith("tel:")) {
    value = `tel:${value}`
  }
  return value
}

export function convertAddress(fhirAddress: fhir.Address, fhirPath: string): hl7V3.Address {
  const allAddressLines = [
    fhirAddress.line,
    fhirAddress.city,
    fhirAddress.district,
    fhirAddress.state
  ].flat().filter(isTruthy)
  const hl7V3Address = new hl7V3.Address()
  if (fhirAddress.use) {
    hl7V3Address._attributes = {
      use: convertAddressUse(fhirAddress.use, fhirPath)
    }
  }
  if (allAddressLines.length) {
    hl7V3Address.streetAddressLine = allAddressLines.map(line => new hl7V3.Text(line))
  }
  if (fhirAddress.postalCode){
    hl7V3Address.postalCode = new hl7V3.Text(fhirAddress.postalCode)
  }
  return hl7V3Address
}

function convertAddressUse(fhirAddressUse: string, fhirPath: string) {
  switch (fhirAddressUse) {
    case "home":
      return hl7V3.AddressUse.HOME
    case "work":
      return hl7V3.AddressUse.WORK
    case "temp":
      return hl7V3.AddressUse.TEMPORARY
    case "billing":
      return hl7V3.AddressUse.POSTAL
    default:
      throw new InvalidValueError(`Unhandled address use '${fhirAddressUse}'.`, fhirPath + ".use")
  }
}

export function convertGender(fhirGender: string, fhirPath: string): hl7V3.SexCode {
  switch (fhirGender) {
    case "male":
      return hl7V3.SexCode.MALE
    case "female":
      return hl7V3.SexCode.FEMALE
    case "other":
      return hl7V3.SexCode.INDETERMINATE
    case "unknown":
      return hl7V3.SexCode.UNKNOWN
    default:
      throw new InvalidValueError(`Unhandled gender '${fhirGender}'.`, fhirPath)
  }
}
