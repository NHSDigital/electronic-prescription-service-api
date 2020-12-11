import * as fhir from "../../../models/fhir/fhir-resources"
import {generateResourceId, getFullUrl} from "./common"

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
    extension: getExtension(messageId),
    eventCoding: getEventCoding(),
    destination: getDestination(representedOrganizationReference),
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
  return [
    {
      reference: getFullUrl(patientReference)
    },
    {
      reference: getFullUrl(medicationRequestReference)
    }
  ]
}

function getSource() {
  return {
    name: "NHS Spine",
    endpoint: `${process.env.BASE_PATH}/$process-message`
  }
}

function getExtension(messageId: string) {
  return [
    {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-Spine-MessageHeader-messageId",
      valueIdentifier: {
        system: "https://tools.ietf.org/html/rfc4122",
        value: messageId.toLowerCase()
      }
    }
  ]
}

function getDestination(representedOrganizationId: string) {
  return [{
    endpoint: `urn:nhs-uk:addressing:ods:${representedOrganizationId}`,
    receiver: {
      identifier: {
        system: "https://fhir.nhs.uk/Id/ods-organization-code",
        value: representedOrganizationId
      }
    }
  }]
}

function getMessageHeaderResponse(cancelRequestId: string): fhir.MessageHeaderResponse {
  return {
    identifier: cancelRequestId.toLowerCase(),
    code: "ok"
  }
}
