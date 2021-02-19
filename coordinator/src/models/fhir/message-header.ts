import * as common from "./common"
import * as practitionerRole from "./practitioner-role"
import * as extension from "./extension"

export enum EventCodingCode {
  PRESCRIPTION = "prescription-order",
  PRESCRIPTION_RESPONSE = "prescription-order-response",
  CANCELLATION = "prescription-order-update",
  DISPENSE = "prescription-dispense"
}

export const EventCoding: Record<string, common.Coding> = Object.freeze({
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

export interface MessageHeader extends common.Resource {
  resourceType: "MessageHeader"
  eventCoding: common.Coding
  sender: common.IdentifierReference<practitionerRole.Organization>
  source: MessageHeaderSource
  focus: Array<common.Reference<common.Resource>>
  extension?: Array<extension.IdentifierExtension | extension.CodingExtension>
  destination?: Array<MessageHeaderDestination>
  response?: MessageHeaderResponse
}

interface MessageHeaderSource {
  name?: string
  endpoint: string
}

export interface MessageHeaderDestination {
  endpoint: string
  receiver: common.IdentifierReference<practitionerRole.PractitionerRole
    | practitionerRole.Organization
    | practitionerRole.Practitioner>
}

export interface MessageHeaderResponse {
  identifier: string
  code: "ok" | "transient-error" | "fatal-error"
}
