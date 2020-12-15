import * as fhir from "../../../models/fhir/fhir-resources"
import * as hl7 from "../../../models/hl7-v3/hl7-v3-people-places"
import {convertAddress, convertTelecom, generateResourceId} from "./common"
import {createIdentifier} from "./fhir-base-types"

export function createOrganization(hl7Organization: hl7.Organization): fhir.Organization {
  return {
    resourceType: "Organization",
    id: generateResourceId(),
    identifier: getOrganizationCodeIdentifier(hl7Organization.id._attributes.extension),
    type: getFixedOrganizationType(),
    name: hl7Organization.name._text,
    telecom: convertTelecom(hl7Organization.telecom),
    address: convertAddress(hl7Organization.addr)
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
