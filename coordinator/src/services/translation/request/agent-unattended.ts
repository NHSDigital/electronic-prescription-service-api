import * as hl7V3 from "../../../models/hl7-v3"
import * as hl7v3 from "../../../models/hl7-v3"
import * as fhir from "../../../models/fhir"
import {getIdentifierValueForSystem} from "../common"
import {convertAddress, convertTelecom} from "./demographics"
import pino from "pino"
import {odsClient} from "../../communication/ods-client"
import {InvalidValueError} from "../../../models/errors/processing-errors"

export async function createAuthorForUnattendedAccess(
  organizationCode: string,
  logger: pino.Logger
): Promise<hl7v3.SendMessagePayloadAuthorAgentPerson> {
  const hl7AgentPerson = await createAgentPersonForUnattendedAccess(organizationCode, logger)
  return new hl7v3.SendMessagePayloadAuthorAgentPerson(hl7AgentPerson)
}

export async function createAgentPersonForUnattendedAccess(
  organizationCode: string,
  logger: pino.Logger
): Promise<hl7v3.AgentPerson> {
  const hl7AgentPerson = new hl7v3.AgentPerson()
  hl7AgentPerson.id = new hl7v3.UnattendedSdsRoleProfileIdentifier()
  hl7AgentPerson.code = new hl7v3.UnattendedSdsJobRoleCode()
  const telecom = new hl7v3.Telecom()
  telecom._attributes = {
    use: hl7v3.TelecomUse.WORKPLACE,
    value: "tel:01234567890"
  }
  hl7AgentPerson.telecom = [telecom]
  hl7AgentPerson.agentPerson = createAgentPersonPersonForUnattendedAccess()
  hl7AgentPerson.representedOrganization = await createRepresentedOrganization(organizationCode, logger)
  return hl7AgentPerson
}

function createAgentPersonPersonForUnattendedAccess(): hl7v3.AgentPersonPerson {
  const agentPerson = new hl7v3.AgentPersonPerson(new hl7v3.UnattendedProfessionalCode())
  const agentPersonPersonName = new hl7v3.Name()
  agentPersonPersonName.given = new hl7v3.Text("Unattended")
  agentPersonPersonName.family = new hl7v3.Text("Access")
  agentPerson.name = agentPersonPersonName
  return agentPerson
}

async function createRepresentedOrganization(
  organizationCode: string,
  logger: pino.Logger
): Promise<hl7v3.Organization> {
  const organization = await odsClient.lookupOrganization(organizationCode, logger)
  if (!organization) {
    throw new InvalidValueError(
      `No organisation details found for code ${organizationCode}`,
      "Parameters.parameter"
    )
  }
  return convertOrganization(organization)
}

function convertOrganization(organization: fhir.Organization): hl7v3.Organization {
  const hl7V3Organization = new hl7V3.Organization()
  const organizationSdsId = getIdentifierValueForSystem(
    organization.identifier,
    "https://fhir.nhs.uk/Id/ods-organization-code",
    `Organization.identifier`
  )
  hl7V3Organization.id = new hl7V3.SdsOrganizationIdentifier(organizationSdsId)
  hl7V3Organization.code = new hl7V3.OrganizationTypeCode()
  if (organization.name) {
    hl7V3Organization.name = new hl7v3.Text(organization.name)
  }
  if (organization.telecom?.length) {
    hl7V3Organization.telecom = convertTelecom(organization.telecom[0], "Organization.telecom")
  }
  if (organization.address?.length) {
    hl7V3Organization.addr = convertAddress(organization.address[0], "Organization.address")
  }
  return hl7V3Organization
}
