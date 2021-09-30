import * as common from "./common"
import * as practitionerRole from "./practitioner-role"
import * as extension from "./extension"

export enum EventCodingCode {
  PRESCRIPTION = "prescription-order",
  PRESCRIPTION_RESPONSE = "prescription-order-response",
  CANCELLATION = "prescription-order-update",
  DISPENSE = "dispense-notification"
}

export const PRESCRIBE_BUNDLE_TYPES = [
  EventCodingCode.PRESCRIPTION,
  EventCodingCode.CANCELLATION
]

export const DISPENSE_BUNDLE_TYPES = [
  EventCodingCode.DISPENSE
]

export const ACCEPTED_BUNDLE_TYPES = PRESCRIBE_BUNDLE_TYPES.concat(DISPENSE_BUNDLE_TYPES)

export const EVENT_CODING_PRESCRIPTION_ORDER_RESPONSE: MessageHeaderEventCoding = {
  system: "https://fhir.nhs.uk/CodeSystem/message-event",
  code: EventCodingCode.PRESCRIPTION_RESPONSE,
  display: "Prescription Order Response"
}

export const EVENT_CODING_PRESCRIPTION_ORDER: MessageHeaderEventCoding = {
  system: "https://fhir.nhs.uk/CodeSystem/message-event",
  code: EventCodingCode.PRESCRIPTION,
  display: "Prescription Order"
}

export interface MessageHeaderEventCoding extends common.Coding {
  code: EventCodingCode
}

export interface MessageHeader extends common.Resource {
  resourceType: "MessageHeader"
  eventCoding: MessageHeaderEventCoding
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
