import * as fhir from "../../../models/fhir/fhir-resources"
import * as hl7 from "../../../models/hl7-v3/hl7-v3-people-places"
import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import {InvalidValueError} from "../../../models/errors/processing-errors"
import {toArray} from "../common"
import {convertAddress} from "./common"

export function createOrganization(hl7Organization: hl7.Organization): fhir.Organization {
  const fhirOrganization = {resourceType: "Organization"} as fhir.Organization

  const hl7OrganizationId = hl7Organization.id._attributes.extension
  fhirOrganization.identifier = getIdentifier(hl7OrganizationId)

  // confirmed with Chris that at this moment in time we will hardcode to RO197 with a fixed display
  fhirOrganization.type = getFixedOrganizationType()

  fhirOrganization.name = hl7Organization.name._text

  const hl7Telecom = toArray(hl7Organization.telecom)
  fhirOrganization.telecom = convertTelecom(hl7Telecom)

  const hl7Address = toArray(hl7Organization.addr)
  fhirOrganization.address = convertAddress(hl7Address)

  return fhirOrganization
}

function getIdentifier(organizationId: string) {
  return [
    {
      "system": "https://fhir.nhs.uk/Id/ods-organization-code",
      "value": organizationId
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

function convertTelecom(telecom: Array<core.Telecom>) {
  return telecom.map(value => ({
    system: "phone",
    value: value._attributes.value.split(":")[1],
    use: convertTelecomUse(value._attributes.use)
  }))
}

function getFixedOrganizationType() {
  return [
    {
      coding:  [
        {
          system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
          code: "RO197",
          display: "NHS TRUST"
        }
      ]
    }
  ]
}
