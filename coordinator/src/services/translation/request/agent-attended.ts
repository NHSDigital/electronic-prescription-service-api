import {hl7V3} from "@models"
import pino from "pino"
import {createRepresentedOrganization} from "./agent-unattended"

export async function createAuthorForAttendedAccess(
  professionalCode: string,
  logger: pino.Logger,
  organizationCode?: string,
): Promise<hl7V3.Author> {
  const agentPerson = await createAgentPersonForAttendedAccess(professionalCode, logger, organizationCode)
  const author = new hl7V3.Author()
  author.AgentPerson = agentPerson
  return author
}

export async function createAgentPersonForAttendedAccess(
  professionalCode: string,
  logger: pino.Logger,
  organizationCode?: string,
): Promise<hl7V3.AgentPerson> {
  const agentPerson = new hl7V3.AgentPerson()
  agentPerson.id = new hl7V3.UnattendedSdsRoleProfileIdentifier()
  agentPerson.code = new hl7V3.UnattendedSdsJobRoleCode()
  const telecom = new hl7V3.Telecom()
  telecom._attributes = {
    use: hl7V3.TelecomUse.WORKPLACE,
    value: "tel:01234567890"
  }
  agentPerson.telecom = [telecom]
  agentPerson.agentPerson = createAgentPersonPersonForAttendedAccess(professionalCode)
  if (organizationCode) {
    agentPerson.representedOrganization = await createRepresentedOrganization(organizationCode, logger)
  }
  return agentPerson
}

export function createAgentPersonPersonForAttendedAccess(professionalCode: string): hl7V3.AgentPersonPerson {
  const agentPerson = new hl7V3.AgentPersonPerson(new hl7V3.ProfessionalCode(professionalCode))
  const agentPersonPersonName = new hl7V3.Name()
  agentPersonPersonName.given = new hl7V3.Text("Attended")
  agentPersonPersonName.family = new hl7V3.Text("Access")
  agentPerson.name = agentPersonPersonName
  return agentPerson
}

