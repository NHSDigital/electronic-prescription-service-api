import * as fhir from "../../../models/fhir/fhir-resources"
import * as hl7 from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertAddress, convertTelecom, generateResourceId} from "./common"

export function createOrganization(hl7Organization: hl7.Organization): fhir.Organization {
  return {
    resourceType: "Organization",
    id: generateResourceId(),
    identifier: getIdentifier(hl7Organization.id._attributes.extension),
    type: getFixedOrganizationType(),
    name: hl7Organization.name._text,
    telecom: convertTelecom(hl7Organization.telecom),
    address: convertAddress(hl7Organization.addr)
  }
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
