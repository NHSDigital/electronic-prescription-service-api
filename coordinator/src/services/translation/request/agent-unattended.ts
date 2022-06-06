import {fhir, hl7V3, processingErrors as errors} from "@models"
import {getCodeableConceptCodingForSystem, getIdentifierValueForSystem} from "../common"
import {convertAddress, convertTelecom} from "./demographics"
import pino from "pino"
import {odsClient} from "../../communication/ods-client"
import Hapi from "@hapi/hapi"
import {
  getRoleCode,
  getSdsRoleProfileId,
  getSdsUserUniqueId,
  getUserName
} from "../../../utils/headers"
import {OrganisationTypeCode} from "../common/organizationTypeCode"

export async function createAuthorFromAuthenticatedUserDetails(
  organizationCode: string,
  headers: Hapi.Util.Dictionary<string>,
  telecom: fhir.ContactPoint,
  logger: pino.Logger
): Promise<hl7V3.Author> {
  const agentPerson = await createAgentPersonFromAuthenticatedUserDetails(organizationCode, headers, telecom, logger)
  const author = new hl7V3.Author()
  author.AgentPerson = agentPerson
  return author
}

export async function createAgentPersonFromAuthenticatedUserDetails(
  organizationCode: string,
  headers: Hapi.Util.Dictionary<string>,
  telecom: fhir.ContactPoint,
  logger: pino.Logger
): Promise<hl7V3.AgentPerson> {

  const sdsRoleProfileId = getSdsRoleProfileId(headers)
  const sdsJobRoleCode = getRoleCode(headers)
  const sdsUserUniqueId = getSdsUserUniqueId(headers)
  const name = getUserName(headers)

  return createAgentPerson(
    organizationCode,
    sdsRoleProfileId,
    sdsJobRoleCode,
    sdsUserUniqueId,
    name,
    telecom,
    logger
  )
}

export async function createAuthor(
  practitionerRole: fhir.PractitionerRole,
  organization: fhir.Organization,
  logger: pino.Logger
): Promise<hl7V3.Author> {
  const agentPerson = await createAgentPersonFromPractitionerRole(practitionerRole, logger)
  const author = new hl7V3.Author()
  author.AgentPerson = agentPerson
  return author
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

export async function createAgentPersonFromPractitionerRole(
  practitionerRole: fhir.PractitionerRole,
  logger: pino.Logger
): Promise<hl7V3.AgentPerson> {
  const practitioner = practitionerRole.practitioner as fhir.IdentifierReference<fhir.Practitioner>
  const sdsRoleProfileId = getIdentifierValueForSystem(
    practitionerRole.identifier,
    "https://fhir.nhs.uk/Id/sds-role-profile-id",
    'Parameters.parameter("agent").resource.identifier'
  )

  const sdsRoleCode = getCodeableConceptCodingForSystem(
    practitionerRole.code,
    "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
    'Parameters.parameter("agent").resource.code'
  ).code

  const sdsUserUniqueId = getIdentifierValueForSystem(
    [practitioner.identifier],
    "https://fhir.nhs.uk/Id/sds-user-id",
    'Parameters.parameter("agent").resource.practitioner'
  )

  const organization = practitionerRole.organization as fhir.IdentifierReference<fhir.Organization>

  return createAgentPerson(
    organization.identifier.value,
    sdsRoleProfileId,
    sdsRoleCode,
    sdsUserUniqueId,
    practitionerRole.practitioner.display,
    practitionerRole.telecom[0],
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

function convertOrganization(
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
