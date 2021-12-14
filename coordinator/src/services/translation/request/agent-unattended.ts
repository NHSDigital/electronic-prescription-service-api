import {fhir, hl7V3, processingErrors as errors} from "@models"
import {getIdentifierValueForSystem} from "../common"
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

export async function createAuthorForUnattendedAccess(
  organizationCode: string,
  headers: Hapi.Util.Dictionary<string>,
  logger: pino.Logger,
  telecom?: string
): Promise<hl7V3.Author> {
  const agentPerson = await createAgentPersonForUnattendedAccess(organizationCode, headers, logger, telecom)
  const author = new hl7V3.Author()
  author.AgentPerson = agentPerson
  return author
}

export async function createAgentPersonForUnattendedAccess(
  organizationCode: string,
  headers: Hapi.Util.Dictionary<string>,
  logger: pino.Logger,
  fhirTelecom?: string
): Promise<hl7V3.AgentPerson> {
  const sdsRoleProfileId = getSdsRoleProfileId(headers)
  const sdsJobRoleCode = getRoleCode(headers)
  const sdsUserUniqueId = getSdsUserUniqueId(headers)
  const name = getUserName(headers)

  const organization = await odsClient.lookupOrganization(organizationCode, logger)
  if (!organization) {
    throw new errors.InvalidValueError(
      `No organisation details found for code ${organizationCode}`,
      "Parameters.parameter"
    )
  }

  const agentPerson = new hl7V3.AgentPerson()
  agentPerson.id = new hl7V3.SdsRoleProfileIdentifier(sdsRoleProfileId)
  agentPerson.code = new hl7V3.SdsJobRoleCode(sdsJobRoleCode)

  agentPerson.agentPerson = createAgentPersonPersonForUnattendedAccess(sdsUserUniqueId, name)
  agentPerson.representedOrganization = convertOrganization(organization)

  const v3Telecom = new hl7V3.Telecom()

  v3Telecom._attributes = {
    use: hl7V3.TelecomUse.WORKPLACE,
    value: fhirTelecom ?? agentPerson.representedOrganization.telecom?._attributes.value
  }

  agentPerson.telecom = [v3Telecom]

  return agentPerson
}

function createAgentPersonPersonForUnattendedAccess(sdsUserUniqueId: string, name: string): hl7V3.AgentPersonPerson {
  const agentPerson = new hl7V3.AgentPersonPerson(new hl7V3.SdsUniqueIdentifier(sdsUserUniqueId))
  const agentPersonPersonName = new hl7V3.Name()
  agentPersonPersonName._text = name
  agentPerson.name = agentPersonPersonName
  return agentPerson
}

function convertOrganization(organization: fhir.Organization): hl7V3.Organization {
  const hl7V3Organization = new hl7V3.Organization()
  const organizationSdsId = getIdentifierValueForSystem(
    organization.identifier,
    "https://fhir.nhs.uk/Id/ods-organization-code",
    `Organization.identifier`
  )
  hl7V3Organization.id = new hl7V3.SdsOrganizationIdentifier(organizationSdsId)
  hl7V3Organization.code = new hl7V3.OrganizationTypeCode()
  if (organization.name) {
    hl7V3Organization.name = new hl7V3.Text(organization.name)
  }
  if (organization.telecom?.length) {
    hl7V3Organization.telecom = convertTelecom(organization.telecom[0], "Organization.telecom")
  }
  if (organization.address?.length) {
    hl7V3Organization.addr = convertAddress(organization.address[0], "Organization.address")
  }
  return hl7V3Organization
}
