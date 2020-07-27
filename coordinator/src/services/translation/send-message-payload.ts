import * as codes from "../../model/hl7-v3-datatypes-codes";
import {GlobalIdentifier} from "../../model/hl7-v3-datatypes-codes";
import * as peoplePlaces from "../../model/hl7-v3-people-places";
import * as core from "../../model/hl7-v3-datatypes-core";
import * as uuid from "uuid";
import moment from "moment";
import {convertMomentToDateTime} from "./common";

export function createSendMessagePayload<T>(
    interactionId: codes.Hl7InteractionIdentifier,
    authorAgentPerson: peoplePlaces.AgentPerson,
    subject: T
): core.SendMessagePayload<T> {
    const sendMessagePayload = new core.SendMessagePayload<T>(
        //TODO - populate id from somewhere in the original message
        new GlobalIdentifier(uuid.v4().toUpperCase()),
        convertMomentToDateTime(moment.utc()),
        interactionId
    )
    sendMessagePayload.communicationFunctionRcv = createCommunicationFunction(process.env.TO_ASID)
    sendMessagePayload.communicationFunctionSnd = createCommunicationFunction(process.env.FROM_ASID)
    sendMessagePayload.ControlActEvent = createControlActEvent(authorAgentPerson, subject)
    return sendMessagePayload
}

function createCommunicationFunction(asid: string) {
    const id = new codes.AccreditedSystemIdentifier(asid)
    const device = new core.Device(id)
    return new core.CommunicationFunction(device)
}

function createControlActEvent<T>(
    authorAgentPerson: peoplePlaces.AgentPerson,
    subject: T
) {
    const controlActEvent = new core.ControlActEvent<T>()
    controlActEvent.author = createControlActEventAuthor(authorAgentPerson)
    controlActEvent.author1 = createControlActEventAuthor1(process.env.FROM_ASID)
    controlActEvent.subject = subject
    return controlActEvent
}

function createControlActEventAuthor(
    authorAgentPersonFromMessage: peoplePlaces.AgentPerson
) {
    const authorAgentPersonPerson = new peoplePlaces.AgentPersonPerson(authorAgentPersonFromMessage.agentPerson.id)
    const sdsJobRoleIdentifier = new codes.SdsJobRoleIdentifier(authorAgentPersonFromMessage.code._attributes.code)
    const sdsRole = new core.SdsRole(sdsJobRoleIdentifier)

    const authorAgentPerson = new core.AgentPersonSds()
    authorAgentPerson.id = authorAgentPersonFromMessage.id
    authorAgentPerson.agentPersonSDS = authorAgentPersonPerson
    authorAgentPerson.part = new core.AgentPersonPart(sdsRole)

    return new core.SendMessagePayloadAuthorPersonSds(authorAgentPerson)
}

function createControlActEventAuthor1(asid: string) {
    const id = new codes.AccreditedSystemIdentifier(asid)
    const agentSystemSystemSds = new core.AgentSystemSystemSds(id)
    const agentSystemSds = new core.AgentSystemSds(agentSystemSystemSds)
    return new core.SendMessagePayloadAuthorSystemSds(agentSystemSds)
}
