import * as fhir from "../../model/fhir-resources"
import * as peoplePlaces from "../../model/hl7-v3-people-places"
import {getCodeableConceptCodingForSystem, getIdentifierValueForSystem, onlyElement} from "./common"
import * as codes from "../../model/hl7-v3-datatypes-codes"
import * as core from "../../model/hl7-v3-datatypes-core"
import {convertAddress, convertTelecom} from "./demographics"

export function convertOrganization(
  fhirBundle: fhir.Bundle,
  fhirOrganization: fhir.Organization
): peoplePlaces.Organization {
  const hl7V3Organization = new peoplePlaces.Organization()

  const organizationSdsId = getIdentifierValueForSystem(fhirOrganization.identifier, "https://fhir.nhs.uk/Id/ods-organization-code")
  hl7V3Organization.id = new codes.SdsOrganizationIdentifier(organizationSdsId)

  if (fhirOrganization.type !== undefined) {
    const organizationTypeCoding = getCodeableConceptCodingForSystem(fhirOrganization.type, "https://fhir.nhs.uk/R4/CodeSystem/organisation-type")
    hl7V3Organization.code = new codes.OrganizationTypeCode(organizationTypeCoding.code)
  }

  if (fhirOrganization.name !== undefined) {
    hl7V3Organization.name = new core.Text(fhirOrganization.name)
  }

  if (fhirOrganization.telecom !== undefined) {
    hl7V3Organization.telecom = fhirOrganization.telecom.map(convertTelecom).reduce(onlyElement)
  }

  if (fhirOrganization.address !== undefined) {
    hl7V3Organization.addr = fhirOrganization.address.map(convertAddress).reduce(onlyElement)
  }

  return hl7V3Organization
}
