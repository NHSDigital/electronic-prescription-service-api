import {SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {Fragment} from "react"
import {HealthcareService, Location, Organization, Practitioner, PractitionerRole} from "fhir/r4"
import {formatName, getAllAddressLines} from "../../formatters/demographics"

export function createPractitionerRoleSummaryListProps(
  practitionerRole: PractitionerRole,
  practitioner: Practitioner,
  organization: Organization,
  healthcareService?: HealthcareService,
  location?: Location
): PractitionerRoleSummaryListProps {
  let organizationProps: PractitionerRoleSummaryListOrganizationProps
  let parentOrganizationProps: PractitionerRoleSummaryListOrganizationProps
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

export interface PractitionerRoleSummaryListProps {
  name: string
  telecom: string
  organization: PractitionerRoleSummaryListOrganizationProps
  parentOrganization: PractitionerRoleSummaryListOrganizationProps
}

interface PractitionerRoleSummaryListOrganizationProps {
  name: string
  odsCode: string
  addressLines?: Array<string>
}

export const PractitionerRoleSummaryList: React.FC<PractitionerRoleSummaryListProps> = ({
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
