import * as fhir from "../../../models/fhir/fhir-resources"
import * as hl7 from "../../../models/hl7-v3/hl7-v3-people-places"
import {toArray} from "../common"
import {convertAddress, convertTelecom} from "./common"

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
