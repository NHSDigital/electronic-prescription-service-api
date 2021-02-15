import * as fhir from "../../../models/fhir/fhir-resources"
import {generateResourceId} from "./common"
import {createIdentifier, createReference} from "./fhir-base-types"

export function createMessageHeader(
  messageId: string,
  eventCoding: fhir.Coding,
  focusIds: Array<string>,
  destinationOrganizationId: string,
  cancelRequestId: string
): fhir.MessageHeader {
  return {
    resourceType: "MessageHeader",
    id: generateResourceId(),
    extension: getExtensions(messageId),
    eventCoding: eventCoding,
    destination: getDestinations(destinationOrganizationId),
    sender: getNhsdSender(),
    source: getSource(),
    response: getMessageHeaderResponse(cancelRequestId),
    focus: createFocus(focusIds)
  }
}

export const EVENT_CODING: Record<string, fhir.Coding> = Object.freeze({
  PRESCRIPTION_ORDER_RESPONSE: {
    system: "https://fhir.nhs.uk/CodeSystem/message-event",
    code: "prescription-order-response",
    display: "Prescription Order Response"
  },
  PRESCRIPTION_ORDER: {
    system: "https://fhir.nhs.uk/CodeSystem/message-event",
    code: "prescription-order",
    display: "Prescription Order"
  }
})

function getNhsdSender() {
  return {
    identifier: {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: "X2601"
    },
    display: "NHS Digital Spine"
  }
}

function createFocus(focusIds: Array<string>) {
  return focusIds.map(createReference)
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
  if (representedOrganizationId) {
    return [{
      endpoint: `urn:nhs-uk:addressing:ods:${representedOrganizationId}`,
      receiver: {
        identifier: createIdentifier("https://fhir.nhs.uk/Id/ods-organization-code", representedOrganizationId)
      }
    }]
  } else {
    return []
  }
}

function getMessageHeaderResponse(cancelRequestId: string): fhir.MessageHeaderResponse {
  return {
    identifier: cancelRequestId.toLowerCase(),
    code: "ok"
  }
}
