import * as fhir from "../../../models/fhir/fhir-resources"
import * as hl7 from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertAddress, convertTelecom, generateResourceId} from "./common"
import {createIdentifier, createReference} from "./fhir-base-types"

export function createOrganization(hl7Organization: hl7.Organization): fhir.Organization {
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

export function createLocations(hl7Organization: hl7.Organization): Array<fhir.Location> {
  const addresses = convertAddress(hl7Organization.addr)
  return addresses.map(
    address => ({
      resourceType: "Location",
      id: generateResourceId(),
      address: address
    })
  )
}

export function createHealthcareService(
  hl7Organization: hl7.Organization,
  locations: Array<fhir.Location>
): fhir.HealthcareService {
  return {
    resourceType: "HealthcareService",
    id: generateResourceId(),
    identifier: getOrganizationCodeIdentifier(hl7Organization.id._attributes.extension),
    location: locations.map(location => createReference(location.id)),
    name: hl7Organization.name._text,
    telecom: convertTelecom(hl7Organization.telecom)
  }
}

function getOrganizationCodeIdentifier(organizationId: string) {
  return [createIdentifier("https://fhir.nhs.uk/Id/ods-organization-code", organizationId)]
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
