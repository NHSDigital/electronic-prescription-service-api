import * as fhir from "../../../models/fhir/fhir-resources"

export function createMessageHeader(
  messageId: string,
  patientReference: string,
  medicationRequestReference: string,
  representedOrganizationId: string,
  cancelRequestId: string
): fhir.MessageHeader {
  const fhirMessageHeader = {resourceType: "MessageHeader"} as fhir.MessageHeader

  fhirMessageHeader.extension = getExtension(messageId)

  fhirMessageHeader.eventCoding = getEventCoding()

  fhirMessageHeader.destination = getDestination(representedOrganizationId)

  fhirMessageHeader.sender = getNhsdSender()

  fhirMessageHeader.source = getSource()

  fhirMessageHeader.response = getMessageHeaderResponse(cancelRequestId)

  fhirMessageHeader.focus = createFocus(patientReference, medicationRequestReference)

  return fhirMessageHeader
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
      reference: patientReference
    },
    {
      reference: medicationRequestReference
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
