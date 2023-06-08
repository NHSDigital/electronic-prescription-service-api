import {hl7V3, fhir} from "@models"
import {convertAddress, convertTelecom, generateResourceId} from "./common"

export function createOrganization(hl7Organization: hl7V3.Organization): fhir.Organization {
  const organization: fhir.Organization = {
    resourceType: "Organization",
    id: generateResourceId(),
    identifier: [getOrganizationCodeIdentifier(hl7Organization.id._attributes.extension)]
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

export function getOrganizationCodeIdentifier(organizationId: string): fhir.Identifier {
  return fhir.createIdentifier("https://fhir.nhs.uk/Id/ods-organization-code", organizationId)
}
