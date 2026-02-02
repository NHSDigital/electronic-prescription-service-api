import {fhir, hl7V3, processingErrors as errors} from "@models"
import {getIdentifierValueForSystem} from "../common"
import {convertAddress, convertTelecom} from "./demographics"
import {OrganisationTypeCode} from "../common/organizationTypeCode"
import {isReference} from "../../../utils/type-guards"
import {convertIsoDateTimeStringToHl7V3DateTime} from "../common/dateTime"
import {getJobRoleCodeOrName} from "./job-role-code"

export function createAuthor(
  practitionerRole: fhir.PractitionerRole,
  organization: fhir.Organization
): hl7V3.Author {
  const author = new hl7V3.Author()

  author.AgentPerson = createAgentPersonUsingPractitionerRoleAndOrganization(practitionerRole, organization)
  return author
}

export function createAuthorForWithdraw(
  practitionerRole: fhir.PractitionerRole,
  organization: fhir.Organization
): hl7V3.AuthorPersonSds {
  const sdsRoleProfileId = getIdentifierValueForSystem(
    practitionerRole.identifier,
    "https://fhir.nhs.uk/Id/sds-role-profile-id",
    'Task.contained("PractitionerRole").identifier("value")'
  )

  if (isReference(practitionerRole.practitioner)) {
    throw new errors.InvalidValueError(
      "practitionerRole.practitioner should be a Value Identifier",
      'Task.contained("PractitionerRole").practitioner("value")'
    )
  }

  const organizationODS = getIdentifierValueForSystem(
    organization.identifier,
    "https://fhir.nhs.uk/Id/ods-organization-code",
    'Task.contained("Organization").identifier("value")'
  )

  const agentPersonSds = new hl7V3.AgentPersonSds()
  agentPersonSds.id = new hl7V3.SdsRoleProfileIdentifier(sdsRoleProfileId)
  agentPersonSds.agentPersonSDS = new hl7V3.AgentPersonPersonSds(
    new hl7V3.SdsUniqueIdentifier(organizationODS)
  )

  return new hl7V3.AuthorPersonSds(agentPersonSds)
}

export function createLegalAuthenticator(
  practitionerRole: fhir.PractitionerRole,
  organization: fhir.Organization,
  timestamp: string
): hl7V3.PrescriptionLegalAuthenticator {
  const legalAuthenticator = new hl7V3.PrescriptionLegalAuthenticator()

  legalAuthenticator.time = convertIsoDateTimeStringToHl7V3DateTime(timestamp, "Claim.created")
  legalAuthenticator.signatureText = hl7V3.Null.NOT_APPLICABLE
  legalAuthenticator.AgentPerson = createAgentPersonUsingPractitionerRoleAndOrganization(practitionerRole, organization)
  return legalAuthenticator
}

export function createAuthorForDispenseNotification(
  practitionerRole: fhir.PractitionerRole,
  organization: fhir.Organization,
  authorTime: string
): hl7V3.PrescriptionAuthor {
  const author = new hl7V3.PrescriptionAuthor()

  author.time = convertIsoDateTimeStringToHl7V3DateTime(authorTime, "moment.utc")
  author.signatureText = hl7V3.Null.NOT_APPLICABLE
  author.AgentPerson = createAgentPersonUsingPractitionerRoleAndOrganization(
    practitionerRole,
    organization
  )
  return author
}

export function createAgentPersonUsingPractitionerRoleAndOrganization(
  practitionerRole: fhir.PractitionerRole,
  organization: fhir.Organization
): hl7V3.AgentPerson {
  const agentPerson = new hl7V3.AgentPerson()

  const sdsId = getIdentifierValueForSystem(
    practitionerRole.identifier,
    "https://fhir.nhs.uk/Id/sds-role-profile-id",
    "PractitionerRole.identifier"
  )
  agentPerson.id = new hl7V3.SdsRoleProfileIdentifier(sdsId)

  const sdsRoleCode = getJobRoleCodeOrName(practitionerRole).code
  agentPerson.code = new hl7V3.SdsJobRoleCode(sdsRoleCode)

  agentPerson.telecom = [convertTelecom(practitionerRole.telecom[0], "")]

  agentPerson.agentPerson = createAgentPersonPersonUsingPractitionerRole(practitionerRole)

  agentPerson.representedOrganization = convertOrganization(organization, practitionerRole.telecom[0])

  return agentPerson
}

export function createAgentPersonPersonUsingPractitionerRole(
  practitionerRole: fhir.PractitionerRole
): hl7V3.AgentPersonPerson {
  if (isReference(practitionerRole.practitioner)) {
    throw new errors.InvalidValueError(
      "PractitionerRole.practitioner should be an Identifier",
      "PractitionerRole.practitioner"
    )
  }

  const sdsId = getIdentifierValueForSystem(
    [practitionerRole.practitioner.identifier],
    "https://fhir.nhs.uk/Id/sds-user-id",
    "PractitionerRole.practitioner"
  )
  //we want OID ending in 1.54 because of decision D011
  const agentPersonPerson = new hl7V3.AgentPersonPerson(new hl7V3.ProfessionalCode(sdsId))

  if (practitionerRole.practitioner.display !== undefined) {
    const agentPersonPersonName = new hl7V3.Name()
    agentPersonPersonName._text = practitionerRole.practitioner.display
    agentPersonPerson.name = agentPersonPersonName
  }

  return agentPersonPerson
}

export function convertOrganization(
  organization: fhir.Organization,
  agentPersonTelecom: fhir.ContactPoint
): hl7V3.Organization {
  const telecom = organization.telecom?.length ? organization.telecom[0] : agentPersonTelecom
  const hl7v3Telecom = convertTelecom(telecom, "Organization.telecom")
  const hl7V3Organization = new hl7V3.Organization()
  const organizationSdsId = getIdentifierValueForSystem(
    organization.identifier,
    "https://fhir.nhs.uk/Id/ods-organization-code",
    `Organization.identifier`
  )
  hl7V3Organization.id = new hl7V3.SdsOrganizationIdentifier(organizationSdsId)
  hl7V3Organization.code = new hl7V3.OrganizationTypeCode(OrganisationTypeCode.NOT_SPECIFIED)
  if (organization.name) {
    hl7V3Organization.name = new hl7V3.Text(organization.name)
  }
  hl7V3Organization.telecom = hl7v3Telecom
  if (organization.address?.length) {
    hl7V3Organization.addr = convertAddress(organization.address[0], "Organization.address")
  }
  return hl7V3Organization
}
