import {SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {Fragment} from "react"
import {HealthcareService, Location, Organization, Practitioner, PractitionerRole} from "fhir/r4"
import {formatName, getAllAddressLines} from "../../formatters/demographics"

export function createSummaryPractitionerRole(
  practitionerRole: PractitionerRole,
  practitioner: Practitioner,
  organization: Organization,
  healthcareService?: HealthcareService,
  location?: Location
): SummaryPractitionerRole {
  let organizationProps: SummaryOrganization
  let parentOrganizationProps: SummaryOrganization
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
    telecom: practitionerRole.telecom[0].value,
    organization: organizationProps,
    parentOrganization: parentOrganizationProps
  }
}

export interface SummaryPractitionerRole {
  name: string
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
  telecom,
  organization,
  parentOrganization
}) => {
  const addressLineFragments = organization.addressLines.map((addressLine, index) => (
    <Fragment key={index}>
      {index > 0 && <br/>}
      {addressLine}
    </Fragment>
  ))
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <SummaryList>
      <SummaryList.Row>
        <SummaryList.Key>Name</SummaryList.Key>
        <SummaryList.Value>{name}</SummaryList.Value>
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
