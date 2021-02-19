import * as fhir from "./fhir-resources"

export enum EventCodingCode {
  PRESCRIPTION = "prescription-order",
  PRESCRIPTION_RESPONSE = "prescription-order-response",
  CANCELLATION = "prescription-order-update",
  DISPENSE = "prescription-dispense"
}

export const EventCoding: Record<string, fhir.Coding> = Object.freeze({
  PRESCRIPTION_ORDER_RESPONSE: {
    system: "https://fhir.nhs.uk/CodeSystem/message-event",
    code: EventCodingCode.PRESCRIPTION_RESPONSE,
    display: "Prescription Order Response"
  },
  PRESCRIPTION_ORDER: {
    system: "https://fhir.nhs.uk/CodeSystem/message-event",
    code: EventCodingCode.PRESCRIPTION,
    display: "Prescription Order"
  }
})

export interface MessageHeader extends fhir.Resource {
  resourceType: "MessageHeader"
  eventCoding: fhir.Coding
  sender: fhir.IdentifierReference<fhir.Organization>
  source: MessageHeaderSource
  focus: Array<fhir.Reference<fhir.Resource>>
  extension?: Array<fhir.IdentifierExtension | fhir.CodingExtension>
  destination?: Array<MessageHeaderDestination>
  response?: MessageHeaderResponse
}

interface MessageHeaderSource {
  name?: string
  endpoint: string
}

export interface MessageHeaderDestination {
  endpoint: string
  receiver: fhir.IdentifierReference<fhir.PractitionerRole | fhir.Organization | fhir.Practitioner>
}

export interface MessageHeaderResponse {
  identifier: string
  code: "ok" | "transient-error" | "fatal-error"
}
