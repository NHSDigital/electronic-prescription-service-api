import {HealthcareService, Identifier, Location, Organization, Practitioner, PractitionerRole} from "fhir/r4"
import {SummaryList} from "nhsuk-react-components"
import React from "react"
import {formatName, getAllAddressLines} from "../../../formatters/demographics"
import {newLineFormatter} from "../../common/newLineFormatter"

interface SummaryOrganization {
  name: string
  odsCode: string
  addressLines?: Array<string>
}

interface SummaryPractitionerRole {
  name: string
  professionalCodes: Array<string>
  telecom: string
  organization: SummaryOrganization
  parentOrganization: SummaryOrganization
}

const PractitionerRoleSummaryList = ({
  name,
  professionalCodes,
  telecom,
  organization,
  parentOrganization
}: SummaryPractitionerRole) => {
  const addressLineFragments = newLineFormatter(organization.addressLines)
  const professionalCodeFragments = newLineFormatter(professionalCodes)

  return (
    <SummaryList>
      <SummaryList.Row>
        <SummaryList.Key>Name</SummaryList.Key>
        <SummaryList.Value>{name}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Professional Codes</SummaryList.Key>
        <SummaryList.Value>{professionalCodeFragments}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Telecom</SummaryList.Key>
        <SummaryList.Value>{telecom}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Organization</SummaryList.Key>
        <SummaryList.Value>{organization.name} ({organization.odsCode})</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Address</SummaryList.Key>
        <SummaryList.Value>{addressLineFragments}</SummaryList.Value>
      </SummaryList.Row>
      <SummaryList.Row>
        <SummaryList.Key>Trust / CCG</SummaryList.Key>
        <SummaryList.Value>{parentOrganization.name} ({parentOrganization.odsCode})</SummaryList.Value>
      </SummaryList.Row>
    </SummaryList>
  )
}

function createSummaryPractitionerRole(
  practitionerRole: PractitionerRole,
  practitioner: Practitioner,
  organization: Organization,
  healthcareService?: HealthcareService,
  location?: Location
): SummaryPractitionerRole {
  let organizationProps: SummaryOrganization
  let parentOrganizationProps: SummaryOrganization

  const professionalCodes = getProfessionalCodes([...practitionerRole.identifier, ...practitioner.identifier])

  if (healthcareService) {
    organizationProps = {
      name: healthcareService.name,
      odsCode: healthcareService.identifier[0].value,
      addressLines: getAllAddressLines(location.address)
    }
    parentOrganizationProps = {
      name: organization.name,
      odsCode: organization.identifier[0].value
    }
  } else {
    organizationProps = {
      name: organization.name,
      odsCode: organization.identifier[0].value,
      addressLines: getAllAddressLines(organization.address[0])
    }
    parentOrganizationProps = {
      name: organization.partOf.display,
      odsCode: organization.partOf.identifier.value
    }
  }

  return {
    name: formatName(practitioner.name[0]),
    professionalCodes: professionalCodes,
    telecom: practitionerRole.telecom[0].value,
    organization: organizationProps,
    parentOrganization: parentOrganizationProps
  }
}

function getProfessionalCodes(identifiers: Array<Identifier>): Array<string> {
  return identifiers.map(identifier => {
    switch (identifier.system) {
      case "https://fhir.nhs.uk/Id/sds-user-id":
        return "SDS User ID - " + identifier.value
      case "https://fhir.hl7.org.uk/Id/gmc-number":
        return "GMC Number - " + identifier.value
      case "https://fhir.hl7.org.uk/Id/gmp-number":
        return "GMP Number - " + identifier.value
      case "https://fhir.hl7.org.uk/Id/din-number":
        return "DIN Number - " + identifier.value
      case "https://fhir.hl7.org.uk/Id/gphc-number":
        return "GPHC Number - " + identifier.value
      case "https://fhir.hl7.org.uk/Id/hcpc-number":
        return "HCPC Number - " + identifier.value
      case "https://fhir.hl7.org.uk/Id/nmc-number":
        return "NMC Number - " + identifier.value
      case "https://fhir.hl7.org.uk/Id/nhsbsa-spurious-code":
        return "Spurious Code - " + identifier.value
      case "https://fhir.nhs.uk/Id/sds-role-profile-id":
        return "SDS Role Profile ID - " + identifier.value
      default:
        return "Unknown Code - " + identifier.value
    }
  })
}

export {
  SummaryPractitionerRole,
  PractitionerRoleSummaryList,
  createSummaryPractitionerRole
}
