import {convertAddress, convertTelecom, generateResourceId} from "./common"
import * as hl7V3 from "../../../models/hl7-v3"
import * as fhir from "@models/fhir"

export function createOrganization(hl7Organization: hl7V3.Organization): fhir.Organization {
  const organization: fhir.Organization = {
    resourceType: "Organization",
    id: generateResourceId(),
    identifier: getOrganizationCodeIdentifier(hl7Organization.id._attributes.extension),
    type: getFixedOrganizationType()
  }
  if (hl7Organization.name) {
    organization.name = hl7Organization.name._text
  }
  if (hl7Organization.telecom) {
    organization.telecom = convertTelecom(hl7Organization.telecom)
  }
  if (hl7Organization.addr) {
    organization.address = convertAddress(hl7Organization.addr)
  }
  return organization
}

export function createLocations(organization: hl7V3.Organization): Array<fhir.Location> {
  const addresses = convertAddress(organization.addr)
  return addresses.map(
    address => ({
      resourceType: "Location",
      id: generateResourceId(),
      address: address
    })
  )
}

export function createHealthcareService(
  organization: hl7V3.Organization,
  locations: Array<fhir.Location>
): fhir.HealthcareService {
  return {
    resourceType: "HealthcareService",
    id: generateResourceId(),
    identifier: getOrganizationCodeIdentifier(organization.id._attributes.extension),
    location: locations.map(location => fhir.createReference(location.id)),
    name: organization.name._text,
    telecom: convertTelecom(organization.telecom)
  }
}

function getOrganizationCodeIdentifier(organizationId: string) {
  return [fhir.createIdentifier("https://fhir.nhs.uk/Id/ods-organization-code", organizationId)]
}

function getFixedOrganizationType() {
  return [
    {
      coding:  [
        {
          system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
          code: "197",
          display: "NHS TRUST"
        }
      ]
    }
  ]
}
