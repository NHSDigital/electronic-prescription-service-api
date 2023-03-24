import moment from "moment"
import {convertMomentToHl7V3DateTime} from "../../common/dateTime"
import {hl7V3} from "@models"
import {getAsid, getSdsRoleProfileId, getSdsUserUniqueId} from "../../../../utils/headers"
import Hapi from "@hapi/hapi"

export function createSendMessagePayload<T>(
  messageId: string,
  interactionId: hl7V3.Hl7InteractionIdentifier,
  headers: Hapi.Utils.Dictionary<string>,
  subject: T
): hl7V3.SendMessagePayload<T> {
  const fromAsid = getAsid(headers)

  const sendMessagePayload = new hl7V3.SendMessagePayload<T>(
    new hl7V3.GlobalIdentifier(messageId),
    convertMomentToHl7V3DateTime(moment.utc()),
    interactionId
  )

  sendMessagePayload.communicationFunctionRcv = createCommunicationFunction(process.env.TO_ASID)
  sendMessagePayload.communicationFunctionSnd = createCommunicationFunction(fromAsid)
  sendMessagePayload.ControlActEvent = createControlActEvent(headers, subject)
  return sendMessagePayload
}

function createCommunicationFunction(asid: string) {
  const id = new hl7V3.AccreditedSystemIdentifier(asid)
  const device = new hl7V3.Device(id)
  return new hl7V3.CommunicationFunction(device)
}

function createControlActEvent<T>(
  headers: Hapi.Utils.Dictionary<string>,
  subject: T
) {
  const sdsUniqueIdentifier = getSdsUserUniqueId(headers)
  const sdsRoleProfileIdentifier = getSdsRoleProfileId(headers)
  const fromAsid = getAsid(headers)

  const controlActEvent = new hl7V3.ControlActEvent<T>()
  if (sdsUniqueIdentifier && sdsRoleProfileIdentifier) {
    controlActEvent.author = createControlActEventAuthor(sdsUniqueIdentifier, sdsRoleProfileIdentifier)
  }
  controlActEvent.author1 = createControlActEventAuthor1(fromAsid)
  controlActEvent.subject = subject
  return controlActEvent
}

function createControlActEventAuthor(
  sdsUniqueIdentifierStr: string,
  sdsRoleProfileIdentifierStr: string
) {
  const sdsRoleProfileIdentifier = new hl7V3.SdsRoleProfileIdentifier(sdsRoleProfileIdentifierStr)

  const sdsUniqueIdentifier = new hl7V3.SdsUniqueIdentifier(sdsUniqueIdentifierStr)
  const authorAgentPersonPerson = new hl7V3.AgentPersonPersonSds(sdsUniqueIdentifier)

  const sdsJobRoleIdentifier = new hl7V3.SdsJobRoleIdentifier("UNKNOWN")
  const sdsRole = new hl7V3.SdsRole(sdsJobRoleIdentifier)
  const agentPersonPart = new hl7V3.AgentPersonPart(sdsRole)

  const authorAgentPerson = new hl7V3.AgentPersonSds()
  authorAgentPerson.id = sdsRoleProfileIdentifier
  authorAgentPerson.agentPersonSDS = authorAgentPersonPerson
  authorAgentPerson.part = agentPersonPart

  return new hl7V3.AuthorPersonSds(authorAgentPerson)
}

function createControlActEventAuthor1(asid: string) {
  const id = new hl7V3.AccreditedSystemIdentifier(asid)
  const agentSystemSystemSds = new hl7V3.AgentSystemSystemSds(id)
  const agentSystemSds = new hl7V3.AgentSystemSds(agentSystemSystemSds)
  return new hl7V3.AuthorSystemSds(agentSystemSds)
}
