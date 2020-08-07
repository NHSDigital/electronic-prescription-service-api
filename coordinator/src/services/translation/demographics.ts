import * as fhir from "../../model/fhir-resources"
import * as core from "../../model/hl7-v3-datatypes-core"
import * as codes from "../../model/hl7-v3-datatypes-codes"

export function convertName(fhirHumanName: fhir.HumanName): core.Name {
  const nameUse = fhirHumanName.use !== undefined ? convertNameUse(fhirHumanName.use) : undefined
  const name = new core.Name(nameUse)
  if (fhirHumanName.prefix !== undefined) {
    name.prefix = fhirHumanName.prefix.map(name => new core.Text(name))
  }
  if (fhirHumanName.given !== undefined) {
    name.given = fhirHumanName.given.map(name => new core.Text(name))
  }
  if (fhirHumanName.family !== undefined) {
    name.family = new core.Text(fhirHumanName.family)
  }
  if (fhirHumanName.suffix !== undefined) {
    name.suffix = fhirHumanName.suffix.map(name => new core.Text(name))
  }
  return name
}

function convertNameUse(fhirNameUse: string) {
  switch (fhirNameUse) {
  case "usual":
    return core.NameUse.USUAL
  case "official":
    return core.NameUse.USUAL
  case "nickname":
    return core.NameUse.ALIAS
  default:
    throw TypeError("Unhandled name use " + fhirNameUse)
  }
}

export function convertTelecom(fhirTelecom: fhir.ContactPoint): core.Telecom {
  const hl7V3TelecomUse = convertTelecomUse(fhirTelecom.use)
  //TODO - do we need to add "tel:", "mailto:" to the value?
  return new core.Telecom(hl7V3TelecomUse, fhirTelecom.value)
}

function convertTelecomUse(fhirTelecomUse: string) {
  switch (fhirTelecomUse) {
  case "home":
    return core.TelecomUse.PERMANENT_HOME
  case "work":
    return core.TelecomUse.WORKPLACE
  case "temp":
    return core.TelecomUse.TEMPORARY
  case "mobile":
    return core.TelecomUse.MOBILE
  default:
    throw TypeError("Unhandled telecom use " + fhirTelecomUse)
  }
}

export function convertAddress(fhirAddress: fhir.Address): core.Address {
  const allAddressLines = [
    ...(fhirAddress.line ? fhirAddress.line : []),
    fhirAddress.city,
    fhirAddress.district,
    fhirAddress.state
  ].filter(line => line !== undefined)
  const hl7V3Address = new core.Address()
  if (fhirAddress.use !== undefined)
    hl7V3Address.setUse(convertAddressUse(fhirAddress.use, fhirAddress.type))
  hl7V3Address.streetAddressLine = allAddressLines.map(line => new core.Text(line))
  hl7V3Address.postalCode = new core.Text(fhirAddress.postalCode)
  return hl7V3Address
}

function convertAddressUse(fhirAddressUse: string, fhirAddressType: string) {
  if (fhirAddressType === "postal") {
    return core.AddressUse.POSTAL
  }
  switch (fhirAddressUse) {
  case "home":
    return core.AddressUse.HOME
  case "work":
    return core.AddressUse.WORK
  case "temp":
    return core.AddressUse.TEMPORARY
  default:
    throw TypeError("Unhandled address use " + fhirAddressUse)
  }
}

export function convertGender(fhirGender: string): codes.SexCode {
  switch (fhirGender) {
  case "male":
    return codes.SexCode.MALE
  case "female":
    return codes.SexCode.FEMALE
  case "other":
    return codes.SexCode.INDETERMINATE
  case "unknown":
    return codes.SexCode.UNKNOWN
  default:
    throw new TypeError("Unhandled gender " + fhirGender)
  }
}
