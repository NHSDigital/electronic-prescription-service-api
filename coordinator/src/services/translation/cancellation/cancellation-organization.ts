import {AgentPerson, Organization} from "../../../models/hl7-v3/hl7-v3-people-places"
import * as fhir from "../../../models/fhir/fhir-resources"
import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import {InvalidValueError} from "../../../models/errors/processing-errors"
import {toArray} from "../common"

export function createOrganization(agentPerson: AgentPerson): fhir.Organization {
  const representedOrganization = agentPerson.representedOrganization
  const fhirOrganization = {resourceType: "Organization"} as fhir.Organization

  fhirOrganization.identifier = getIdentifier(representedOrganization)

  //TODO whats this supposed to be??
  // fhirOrganization.type = [
  //   {
  //     "coding":  [
  //       {
  //         "system": "https://fhir.nhs.uk/CodeSystem/organisation-role",
  //         "code": agentPerson.code._attributes.code, maybe?
  //         "display": "???"
  //       }
  //     ]
  //   }
  // ]

  fhirOrganization.name = representedOrganization.name._text

  fhirOrganization.telecom = toArray(representedOrganization.telecom).map(value => ({
    system: "phone",
    value: value._attributes.value.split(":")[1],
    use: convertTelecomUse(value._attributes.use)
  }))

  fhirOrganization.address = toArray(representedOrganization.addr).map(addr => ({
    line: addr.streetAddressLine.map(addressLine => addressLine._text),
    postalCode: addr.postalCode._text
  }))

  return fhirOrganization
}

function getIdentifier(representedOrganization: Organization) {
  return [
    {
      "system": "https://fhir.nhs.uk/Id/ods-organization-code",
      "value": representedOrganization.id._attributes.extension
    }
  ]
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
