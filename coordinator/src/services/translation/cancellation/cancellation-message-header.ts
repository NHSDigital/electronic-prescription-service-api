import * as fhir from "../../../models/fhir/fhir-resources"
import {generateResourceId} from "./common"
import {createIdentifier, createReference} from "./fhir-base-types"

export function createMessageHeader(
  messageId: string,
  patientReference: string,
  medicationRequestReference: string,
  representedOrganizationReference: string,
  cancelRequestId: string
): fhir.MessageHeader {
  return {
    resourceType: "MessageHeader",
    id: generateResourceId(),
    extension: getExtensions(messageId),
    eventCoding: getEventCoding(),
    destination: getDestinations(representedOrganizationReference),
    sender: getNhsdSender(),
    source: getSource(),
    response: getMessageHeaderResponse(cancelRequestId),
    focus: createFocus(patientReference, medicationRequestReference)
  }
}

function getEventCoding() {
  return {
    system: "https://fhir.nhs.uk/CodeSystem/message-event",
    code: "prescription-order-response",
    display: "Prescription Order Response"
  }
}

function getNhsdSender() {
  return {
    identifier: {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: "X2601"
    },
    display: "NHS Digital Spine"
  }
}

function createFocus(patientReference: string, medicationRequestReference: string) {
  return [createReference(patientReference), createReference(medicationRequestReference)]
}

function getSource() {
  return {
    name: "NHS Spine",
    endpoint: `${process.env.BASE_PATH}/$process-message`
  }
}

function getExtensions(messageId: string): Array<fhir.IdentifierExtension> {
  return [{
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-Spine-MessageHeader-messageId",
    valueIdentifier: createIdentifier("https://tools.ietf.org/html/rfc4122", messageId.toLowerCase())
  }]
}

function getDestinations(representedOrganizationId: string): Array<fhir.MessageHeaderDestination> {
  return [{
    endpoint: `urn:nhs-uk:addressing:ods:${representedOrganizationId}`,
    receiver: {
      identifier: createIdentifier("https://fhir.nhs.uk/Id/ods-organization-code", representedOrganizationId)
    }
  }]
}

function getMessageHeaderResponse(cancelRequestId: string): fhir.MessageHeaderResponse {
  return {
    identifier: cancelRequestId.toLowerCase(),
    code: "ok"
  }
}
