import {SummaryList} from "nhsuk-react-components"
import * as React from "react"
import {HealthcareService, Location, Organization, Practitioner, PractitionerRole} from "fhir/r4"
import {NameSummaryListRow} from "./nameSummaryListRow"
import {OrganizationSummaryListRows} from "./organizationSummaryListRows"

interface PractitionerRoleSummaryListProps {
  practitionerRole: PractitionerRole,
  practitioner: Practitioner,
  organization: Organization,
  healthcareService?: HealthcareService,
  location?: Location
}

export const PractitionerRoleSummaryList: React.FC<PractitionerRoleSummaryListProps> = ({
  practitionerRole,
  practitioner,
  organization,
  healthcareService,
  location
}) => {
  const organizationDetails = healthcareService
    ? createDetailsForHealthcareService(healthcareService, location, organization)
    : createDetailsForOrganization(organization)
  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <SummaryList>
      <NameSummaryListRow name={practitioner.name[0]}/>
      <SummaryList.Row>
        <SummaryList.Key>Telecom</SummaryList.Key>
        <SummaryList.Value>{practitionerRole.telecom[0].value}</SummaryList.Value>
      </SummaryList.Row>
      {organizationDetails}
    </SummaryList>
  )
}

function createDetailsForHealthcareService(
  healthcareService: HealthcareService,
  location: Location,
  organization: Organization
) {
  return <OrganizationSummaryListRows
    name={healthcareService.name}
    odsCode={healthcareService.identifier[0].value}
    address={location.address}
    parentName={organization.name}
    parentOdsCode={organization.identifier[0].value}
  />
}

function createDetailsForOrganization(organization: Organization) {
  return <OrganizationSummaryListRows
    name={organization.name}
    odsCode={organization.identifier[0].value}
    address={organization.address[0]}
    parentName={organization.partOf.display}
    parentOdsCode={organization.partOf.identifier.value}
  />
}
