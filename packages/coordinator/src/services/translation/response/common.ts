import * as uuid from "uuid"
import {toArray} from "../common"
import {fhir, hl7V3, processingErrors as errors} from "@models"
import {CareSetting, getCareSetting} from "../common/organizationTypeCode"

export function convertName(names: Array<hl7V3.Name> | hl7V3.Name): Array<fhir.HumanName> {
  const nameArray = toArray(names)
  return nameArray.map(name => {
    const convertedName: fhir.HumanName = {}
    if (name._attributes?.use) {
      convertedName.use = convertNameUse(name._attributes.use)
    }

    if (name._text) {
      convertedName.text = name._text
      return convertedName
    }

    if (name.family) {
      convertedName.family = name.family._text
    }
    if (name.given) {
      convertedName.given = toArray(name.given).map(given => given._text)
    }
    if (name.prefix) {
      convertedName.prefix = toArray(name.prefix).map(prefix => prefix._text)
    }
    if (name.suffix) {
      convertedName.suffix = toArray(name.suffix).map(suffix => suffix._text)
    }
    return convertedName
  })
}

export function humanNameArrayToString(names: Array<fhir.HumanName>): string {
  return names.map(name => {
    if (name.text) {
      return name.text
    } else {
      return `${name.prefix || ""} ${name.given || ""} ${name.family || ""} ${name.suffix || ""}`
    }
  }).join(" ")
}

function convertNameUse(hl7NameUse: string): string {
  switch (hl7NameUse) {
    case hl7V3.NameUse.USUAL:
      return "usual"
    case hl7V3.NameUse.ALIAS:
      return "temp"
    case hl7V3.NameUse.PREFERRED:
      return "nickname"
    case hl7V3.NameUse.PREVIOUS_BIRTH:
    case hl7V3.NameUse.PREVIOUS:
      return "old"
    case hl7V3.NameUse.PREVIOUS_BACHELOR:
    case hl7V3.NameUse.PREVIOUS_MAIDEN:
      return "maiden"
    default:
      throw new errors.InvalidValueError(`Unhandled name use '${hl7NameUse}'.`)
  }
}

export function convertAddress(addresses: Array<hl7V3.Address> | hl7V3.Address): Array<fhir.Address> {
  const addressArray = toArray(addresses)
  return addressArray.map(address => {
    const convertedAddress: fhir.Address = {}
    if (address._attributes?.use) {
      convertedAddress.use = convertAddressUse(address._attributes.use)
    }

    if (address._text) {
      convertedAddress.text = address._text
      return convertedAddress
    }

    if (address.streetAddressLine) {
      convertedAddress.line = address.streetAddressLine.map(addressLine => addressLine._text)
    }
    if (address.postalCode) {
      convertedAddress.postalCode = address.postalCode._text
    }
    return convertedAddress
  })
}

function convertAddressUse(addressUse: hl7V3.AddressUse): string {
  switch (addressUse) {
    case hl7V3.AddressUse.HOME:
    case hl7V3.AddressUse.PRIMARY_HOME:
      return "home"
    case hl7V3.AddressUse.WORK:
    case hl7V3.AddressUse.BUSINESS:
      return "work"
    case hl7V3.AddressUse.TEMPORARY:
      return "temp"
    case hl7V3.AddressUse.POSTAL:
      return "billing"
    case undefined:
      return undefined
    default:
      throw new errors.InvalidValueError(`Unhandled address use '${addressUse}'.`)
  }
}

export function convertTelecom(telecoms: Array<hl7V3.Telecom> | hl7V3.Telecom): Array<fhir.ContactPoint> {
  const telecomArray = toArray(telecoms)
  return telecomArray.map(telecom => {
    const convertedTelecom: fhir.ContactPoint = {
      system: "phone"
    }
    if (telecom._attributes?.use) {
      convertedTelecom.use = convertTelecomUse(telecom._attributes.use)
    }
    if (telecom._attributes?.value) {
      const prefixedValue = telecom._attributes.value
      const colonIndex = prefixedValue.indexOf(":")
      convertedTelecom.value = prefixedValue.substring(colonIndex + 1)
    }
    return convertedTelecom
  })
}

function convertTelecomUse(telecomUse: string): string {
  switch (telecomUse) {
    case hl7V3.TelecomUse.PERMANENT_HOME:
    case hl7V3.TelecomUse.HOME:
      return "home"
    case hl7V3.TelecomUse.WORKPLACE:
      return "work"
    case hl7V3.TelecomUse.TEMPORARY:
      return "temp"
    case hl7V3.TelecomUse.MOBILE:
    case hl7V3.TelecomUse.PAGER:
      return "mobile"
    //TODO these are possible values, but we don'e know what to map them to
    // case core.TelecomUse.ANSWERING_MACHINE:
    // case core.TelecomUse.EMERGENCY_CONTACT:
    //   return "home+rank"
    default:
      throw new errors.InvalidValueError(`Unhandled telecom use '${telecomUse}'.`)
  }
}

export function generateResourceId(): string {
  return uuid.v4()
}

export function getFullUrl(uuid: string): string {
  return `urn:uuid:${uuid}`
}

export function convertResourceToBundleEntry(resource: fhir.Resource): fhir.BundleEntry {
  if (resource.id) {
    return {
      fullUrl: getFullUrl(resource.id),
      resource
    }
  }
  return {
    resource
  }
}

export function roleProfileIdIdentical(agentPerson1: hl7V3.AgentPerson, agentPerson2: hl7V3.AgentPerson): boolean {
  return agentPerson1.id?._attributes.extension === agentPerson2.id?._attributes.extension
}

export function isSecondaryCare(organisation: hl7V3.Organization): boolean {
  return getCareSetting(organisation.code?._attributes.code) === CareSetting.SECONDARY_CARE
}

export function addIdentifierToPractitionerOrRole(
  practitionerRole: fhir.PractitionerRole,
  practitioner: fhir.Practitioner,
  identifier: fhir.Identifier
): void {
  if (identifier.system === "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code") {
    addIdentifierIfNotPresent(practitionerRole.identifier, identifier)
  } else {
    addIdentifierIfNotPresent(practitioner.identifier, identifier)
  }
}

export function orderBundleResources(r1: fhir.Resource, r2: fhir.Resource): number {
  return getSortIndex(r1) - getSortIndex(r2)
}

function getSortIndex(resource: fhir.Resource) {
  let sortIndex = 0
  switch (resource.resourceType) {
    case "MessageHeader":
      sortIndex = 0
      break
    case "MedicationRequest":
      sortIndex = 1
      break
    case "Patient":
      sortIndex = 2
      break
    case "Practitioner":
      sortIndex = 3
      break
    case "PractitionerRole":
      sortIndex = 4
      break
    case "Organization":
      sortIndex = 5
      break
    case "HealthcareService":
      sortIndex = 6
      break
    case "Location":
      sortIndex = 7
      break
    case "Provenance":
      sortIndex = 8
      break
  }
  return sortIndex
}

function addIdentifierIfNotPresent(identifiers: Array<fhir.Identifier>, identifier: fhir.Identifier) {
  if (!identifiers.find(existingIdentifier =>
    existingIdentifier?.system === identifier?.system
    && existingIdentifier?.value === identifier?.value
  )) {
    identifiers.push(identifier)
  }
}
