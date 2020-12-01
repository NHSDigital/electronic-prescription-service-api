import * as fhir from "../../../models/fhir/fhir-resources"

export function createMessageHeader(
  messageId: string,
  patientReference: string,
  medicationRequestReference: string
): fhir.MessageHeader {
  const fhirMessageHeader = {resourceType: "MessageHeader"} as fhir.MessageHeader

  fhirMessageHeader.extension = [
    {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-Spine-MessageHeader-messageId",
      valueIdentifier: {
        system: "https://tools.ietf.org/html/rfc4122",
        value: messageId.toLocaleLowerCase()
      }
    }
    // {
    //   url: "",
    //   valueCoding: {code: ""} // TODO: ValueSet 'Message Status Codes' where do these come from?
    // }
  ]

  fhirMessageHeader.eventCoding = getEventCoding()

  // fhirMessageHeader.destination = []

  fhirMessageHeader.sender = getNhsdSender()

  // fhirMessageHeader.source = {}

  // fhirMessageHeader.response = {}

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
