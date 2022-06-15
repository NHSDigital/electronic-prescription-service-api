import { fhir, hl7V3, processingErrors as errors } from "@models"
import { getCodeableConceptCodingForSystem, getIdentifierValueForSystem } from "../common"
import { convertAddress, convertTelecom } from "./demographics"
import pino from "pino"
import { odsClient } from "../../communication/ods-client"
import Hapi from "@hapi/hapi"
import {
  getRoleCode,
  getSdsRoleProfileId,
  getSdsUserUniqueId,
  getUserName
} from "../../../utils/headers"
import { OrganisationTypeCode } from "../common/organizationTypeCode"
import { isReference } from "../../../utils/type-guards"

export function createAuthor(
  practitionerRole: fhir.PractitionerRole,
  organization: fhir.Organization
): hl7V3.Author {
  const author = new hl7V3.Author()

  author.AgentPerson = createAgentPersonUsingPractitionerRoleAndOrganization(practitionerRole, organization)
  return author
}

export function createAgentPersonUsingPractitionerRoleAndOrganization(
  practitionerRole: fhir.PractitionerRole,
  organization: fhir.Organization,
): hl7V3.AgentPerson {
  const agentPerson = new hl7V3.AgentPerson()

  const sdsId = getIdentifierValueForSystem(
    practitionerRole.identifier,
    "https://fhir.nhs.uk/Id/sds-role-profile-id",
    'Parameters.parameter("agent").resource.identifier'
  )
  agentPerson.id = new hl7V3.SdsRoleProfileIdentifier(sdsId)

  const sdsRoleCode = getCodeableConceptCodingForSystem(
    practitionerRole.code,
    "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
    'Parameters.parameter("agent").resource.code'
  ).code
  agentPerson.code = new hl7V3.SdsJobRoleCode(sdsRoleCode)

  agentPerson.telecom = [convertTelecom(practitionerRole.telecom[0], "")]

  agentPerson.agentPerson = createAgentPersonPersonUsingPractitionerRole(practitionerRole)

  agentPerson.representedOrganization = convertOrganization(organization, practitionerRole.telecom[0])

  return agentPerson
}

export function createAgentPersonPersonUsingPractitionerRole(
  practitionerRole: fhir.PractitionerRole,
): hl7V3.AgentPersonPerson {
  const practitioner = practitionerRole.practitioner

  if (isReference(practitioner)) {
    throw new errors.InvalidValueError(
      "practitionerRole.practitioner should be an Identifier",
      'Parameters.parameter("agent").resource.practitioner'
    )
  }

  const id = getIdentifierValueForSystem(
    [practitioner.identifier],
    "https://fhir.nhs.uk/Id/sds-user-id",
    'Parameters.parameter("agent").resource.practitioner'
  )
  const agentPersonPerson = new hl7V3.AgentPersonPerson(new hl7V3.SdsUniqueIdentifier(id))

  if (practitioner.display !== undefined) {
    const agentPersonPersonName = new hl7V3.Name()
    agentPersonPersonName._text = practitioner.display
    agentPersonPerson.name = agentPersonPersonName
  }

  return agentPersonPerson
}

export async function createAgentPersonFromAuthenticatedUserDetailsAndPractitionerRole(
  containedPractitionerRole: fhir.PractitionerRole,
  headers: Hapi.Util.Dictionary<string>,
  logger: pino.Logger
): Promise<hl7V3.AgentPerson> {
  const containedOrganisation = containedPractitionerRole.organization as fhir.IdentifierReference<fhir.Organization>
  const taskContainedOdsCode = containedOrganisation.identifier.value
  const taskContainedTelecom = containedPractitionerRole.telecom[0]

  const sdsRoleProfileId = getSdsRoleProfileId(headers)
  const sdsJobRoleCode = getRoleCode(headers)
  const sdsUserUniqueId = getSdsUserUniqueId(headers)
  const name = getUserName(headers)

  return createAgentPerson(
    taskContainedOdsCode,
    sdsRoleProfileId,
    sdsJobRoleCode,
    sdsUserUniqueId,
    name,
    taskContainedTelecom,
    logger
  )
}

export async function createAgentPerson(
  organizationCode: string,
  sdsRoleProfileId: string,
  sdsJobRoleCode: string,
  sdsUserUniqueId: string,
  name: string,
  fhirTelecom: fhir.ContactPoint,
  logger: pino.Logger
): Promise<hl7V3.AgentPerson> {
  const organization = await odsClient.lookupOrganization(organizationCode, logger)
  if (!organization) {
    throw new errors.InvalidValueError(
      `No organisation details found for code ${organizationCode}`
    )
  }
  const representedOrganisation = convertOrganization(organization, fhirTelecom)

  const agentPerson = new hl7V3.AgentPerson()
  agentPerson.id = new hl7V3.SdsRoleProfileIdentifier(sdsRoleProfileId)
  agentPerson.code = new hl7V3.SdsJobRoleCode(sdsJobRoleCode)

  agentPerson.telecom = [convertTelecom(fhirTelecom, "")]
  agentPerson.agentPerson = createAgentPersonPerson(sdsUserUniqueId, name)
  agentPerson.representedOrganization = representedOrganisation

  return agentPerson
}

function createAgentPersonPerson(sdsUserUniqueId: string, name: string): hl7V3.AgentPersonPerson {
  const agentPerson = new hl7V3.AgentPersonPerson(new hl7V3.SdsUniqueIdentifier(sdsUserUniqueId))
  const agentPersonPersonName = new hl7V3.Name()
  agentPersonPersonName._text = name
  agentPerson.name = agentPersonPersonName
  return agentPerson
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
