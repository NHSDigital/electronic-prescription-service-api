import moment from "moment"
import {
  getCodeableConceptCodingForSystem,
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  resolveReference
} from "../common"
import {getMedicationRequests} from "../common/getResourcesOfType"
import {convertMomentToHl7V3DateTime} from "../common/dateTime"
import * as hl7V3 from "../../../models/hl7-v3"
import {fhir} from "@models"

export function createSendMessagePayloadForUnattendedAccess<T>(
  messageId: string,
  interactionId: hl7V3.Hl7InteractionIdentifier,
  subject: T
): hl7V3.SendMessagePayload<T> {
  return createSendMessagePayload(messageId, interactionId, undefined, subject)
}

export function createSendMessagePayload<T>(
  messageId: string,
  interactionId: hl7V3.Hl7InteractionIdentifier,
  author: hl7V3.AuthorPersonSds,
  subject: T
): hl7V3.SendMessagePayload<T> {
  const sendMessagePayload = new hl7V3.SendMessagePayload<T>(
    new hl7V3.GlobalIdentifier(messageId),
    convertMomentToHl7V3DateTime(moment.utc()),
    interactionId
  )

  sendMessagePayload.communicationFunctionRcv = createCommunicationFunction(process.env.TO_ASID)
  sendMessagePayload.communicationFunctionSnd = createCommunicationFunction(process.env.FROM_ASID)
  sendMessagePayload.ControlActEvent = createControlActEvent(author, subject)
  return sendMessagePayload
}

function createCommunicationFunction(asid: string) {
  const id = new hl7V3.AccreditedSystemIdentifier(asid)
  const device = new hl7V3.Device(id)
  return new hl7V3.CommunicationFunction(device)
}

function createControlActEvent<T>(
  author: hl7V3.AuthorPersonSds,
  subject: T
) {
  const controlActEvent = new hl7V3.ControlActEvent<T>()
  if (author) {
    controlActEvent.author = author
  }
  controlActEvent.author1 = createControlActEventAuthor1(process.env.FROM_ASID)
  controlActEvent.subject = subject
  return controlActEvent
}

export function convertRequesterToControlActAuthor(
  bundle: fhir.Bundle
): hl7V3.AuthorPersonSds {
  const firstMedicationRequest = getMedicationRequests(bundle)[0]
  const authorPractitionerRole = resolveReference(bundle, firstMedicationRequest.requester)
  const authorPractitioner = resolveReference(bundle, authorPractitionerRole.practitioner)
  return convertPractitionerToControlActAuthor(authorPractitioner, authorPractitionerRole)
}

export function convertResponsiblePractitionerToControlActAuthor(
  bundle: fhir.Bundle
): hl7V3.AuthorPersonSds {
  const firstMedicationRequest = getMedicationRequests(bundle)[0]
  const responsiblePractitionerExtension = getExtensionForUrlOrNull(
    firstMedicationRequest.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
    "MedicationRequest.extension"
  ) as fhir.ReferenceExtension<fhir.PractitionerRole>
  const responsiblePractitionerRoleReference = responsiblePractitionerExtension
    ? responsiblePractitionerExtension.valueReference
    : firstMedicationRequest.requester
  const responsiblePractitionerRole = resolveReference(bundle, responsiblePractitionerRoleReference)
  const responsiblePractitioner = resolveReference(bundle, responsiblePractitionerRole.practitioner)
  return convertPractitionerToControlActAuthor(responsiblePractitioner, responsiblePractitionerRole)
}

function convertPractitionerToControlActAuthor(
  practitioner: fhir.Practitioner,
  practitionerRole: fhir.PractitionerRole
) {
  const sdsUniqueIdentifier = getIdentifierValueForSystem(
    practitioner.identifier,
    "https://fhir.nhs.uk/Id/sds-user-id",
    "Practitioner.identifier"
  )
  const sdsJobRoleCode = getCodeableConceptCodingForSystem(
    practitionerRole.code,
    "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
    "PractitionerRole.code"
  ).code
  const sdsRoleProfileIdentifier = getIdentifierValueForSystem(
    practitionerRole.identifier,
    "https://fhir.nhs.uk/Id/sds-role-profile-id",
    "PractitionerRole.identifier"
  )
  return createControlActEventAuthor(sdsUniqueIdentifier, sdsJobRoleCode, sdsRoleProfileIdentifier)
}

function createControlActEventAuthor(
  sdsUniqueIdentifierStr: string,
  sdsJobRoleCodeStr: string,
  sdsRoleProfileIdentifierStr: string
) {
  const sdsUniqueIdentifier = new hl7V3.SdsUniqueIdentifier(sdsUniqueIdentifierStr)
  const authorAgentPersonPerson = new hl7V3.AgentPersonPersonSds(sdsUniqueIdentifier)

  const sdsJobRoleIdentifier = new hl7V3.SdsJobRoleIdentifier(sdsJobRoleCodeStr)
  const sdsRole = new hl7V3.SdsRole(sdsJobRoleIdentifier)
  const agentPersonPart = new hl7V3.AgentPersonPart(sdsRole)

  const sdsRoleProfileIdentifier = new hl7V3.SdsRoleProfileIdentifier(sdsRoleProfileIdentifierStr)
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
