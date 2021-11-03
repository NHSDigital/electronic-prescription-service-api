import {SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {HealthcareService, Identifier, Location, Organization, Practitioner, PractitionerRole} from "fhir/r4"
import {formatName, getAllAddressLines} from "../../formatters/demographics"
import {newLineFormatter} from "./newLineFormatter"

export function createSummaryPractitionerRole(
  practitionerRole: PractitionerRole,
  practitioner: Practitioner,
  organization: Organization,
  healthcareService?: HealthcareService,
  location?: Location
): SummaryPractitionerRole {
  let organizationProps: SummaryOrganization
  let parentOrganizationProps: SummaryOrganization

  const professionalCodes = getProfessionalCodes(practitioner.identifier)

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

function getProfessionalCodes(identifiers: Array<Identifier>): Array<Record<string, string>> {
  return identifiers.map(identifier => {
    let identifierType: string
    switch (identifier.system) {
      case "https://fhir.nhs.uk/Id/sds-user-id":
        identifierType = "SDS Role ID"
        break
      case "https://fhir.hl7.org.uk/Id/gmc-number":
        identifierType = "GMC Number"
        break
      case "https://fhir.hl7.org.uk/Id/gmp-number":
        identifierType = "GMP Number"
        break
      case "https://fhir.hl7.org.uk/Id/din-number":
        identifierType = "DIN Number"
        break
      case "https://fhir.hl7.org.uk/Id/gphc-number":
        identifierType = "GPHC Number"
        break
      case "https://fhir.hl7.org.uk/Id/hcpc-number":
        identifierType = "HCPC Number"
        break
      case "https://fhir.hl7.org.uk/Id/nmc-number":
        identifierType = "NMC Number"
        break
    }
    return {type: identifierType, value: identifier.value}
  })
}

export interface SummaryPractitionerRole {
  name: string
  professionalCodes: Array<Record<string, string>>
  telecom: string
  organization: SummaryOrganization
  parentOrganization: SummaryOrganization
}

interface SummaryOrganization {
  name: string
  odsCode: string
  addressLines?: Array<string>
}

const PractitionerRoleSummaryList: React.FC<SummaryPractitionerRole> = ({
  name,
  professionalCodes,
  telecom,
  organization,
  parentOrganization
}) => {
  const addressLineFragments = newLineFormatter(organization.addressLines)
  const professionalCodeFragments = newLineFormatter(professionalCodes.map(code => `${code.type} - ${code.value}`))
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
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

export default PractitionerRoleSummaryList
