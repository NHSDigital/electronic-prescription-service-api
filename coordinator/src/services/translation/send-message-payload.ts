import * as codes from "../../model/hl7-v3-datatypes-codes";
import {GlobalIdentifier, SdsRoleProfileIdentifier, SdsUniqueIdentifier} from "../../model/hl7-v3-datatypes-codes";
import * as core from "../../model/hl7-v3-datatypes-core";
import moment from "moment";
import {
    convertMomentToDateTime,
    getCodeableConceptCodingForSystem,
    getIdentifierValueForSystem,
    getResourcesOfType,
    resolveReference
} from "./common";
import {Bundle, MedicationRequest} from "../../model/fhir-resources";

export function createSendMessagePayload<T>(
    messageId: string,
    interactionId: codes.Hl7InteractionIdentifier,
    bundle: Bundle,
    subject: T
): core.SendMessagePayload<T> {
    const sendMessagePayload = new core.SendMessagePayload<T>(
        new GlobalIdentifier(messageId),
        convertMomentToDateTime(moment.utc()),
        interactionId
    )
    sendMessagePayload.communicationFunctionRcv = createCommunicationFunction(process.env.TO_ASID)
    sendMessagePayload.communicationFunctionSnd = createCommunicationFunction(process.env.FROM_ASID)
    sendMessagePayload.ControlActEvent = createControlActEvent(bundle, subject)
    return sendMessagePayload
}

function createCommunicationFunction(asid: string) {
    const id = new codes.AccreditedSystemIdentifier(asid)
    const device = new core.Device(id)
    return new core.CommunicationFunction(device)
}

function createControlActEvent<T>(
    bundle: Bundle,
    subject: T
) {
    const controlActEvent = new core.ControlActEvent<T>()
    controlActEvent.author = convertRequesterToControlActAuthor(bundle)
    controlActEvent.author1 = createControlActEventAuthor1(process.env.FROM_ASID)
    controlActEvent.subject = subject
    return controlActEvent
}

function convertRequesterToControlActAuthor(
    bundle: Bundle
) {
    const firstMedicationRequest = getResourcesOfType(bundle, new MedicationRequest())[0]
    const authorPractitionerRole = resolveReference(bundle, firstMedicationRequest.requester)
    const authorPractitioner = resolveReference(bundle, authorPractitionerRole.practitioner)
    const sdsUniqueIdentifier = getIdentifierValueForSystem(authorPractitioner.identifier, "https://fhir.nhs.uk/Id/sds-user-id")
    const sdsJobRoleCode = getCodeableConceptCodingForSystem(authorPractitionerRole.code, "https://fhir.nhs.uk/R4/CodeSystem/UKCore-SDSJobRoleName").code
    const sdsRoleProfileIdentifier = getIdentifierValueForSystem(authorPractitionerRole.identifier, "https://fhir.nhs.uk/Id/sds-role-profile-id")
    return createControlActEventAuthor(sdsUniqueIdentifier, sdsJobRoleCode, sdsRoleProfileIdentifier);
}

function createControlActEventAuthor(sdsUniqueIdentifierStr: string, sdsJobRoleCodeStr: string, sdsRoleProfileIdentifierStr: string) {
    const sdsUniqueIdentifier = new SdsUniqueIdentifier(sdsUniqueIdentifierStr)
    const authorAgentPersonPerson = new core.AgentPersonPersonSds(sdsUniqueIdentifier)

    const sdsJobRoleIdentifier = new codes.SdsJobRoleIdentifier(sdsJobRoleCodeStr)
    const sdsRole = new core.SdsRole(sdsJobRoleIdentifier)
    const agentPersonPart = new core.AgentPersonPart(sdsRole)

    const sdsRoleProfileIdentifier = new SdsRoleProfileIdentifier(sdsRoleProfileIdentifierStr)
    const authorAgentPerson = new core.AgentPersonSds()
    authorAgentPerson.id = sdsRoleProfileIdentifier
    authorAgentPerson.agentPersonSDS = authorAgentPersonPerson
    authorAgentPerson.part = agentPersonPart

    return new core.SendMessagePayloadAuthorPersonSds(authorAgentPerson)
}

function createControlActEventAuthor1(asid: string) {
    const id = new codes.AccreditedSystemIdentifier(asid)
    const agentSystemSystemSds = new core.AgentSystemSystemSds(id)
    const agentSystemSds = new core.AgentSystemSds(agentSystemSystemSds)
    return new core.SendMessagePayloadAuthorSystemSds(agentSystemSds)
}
