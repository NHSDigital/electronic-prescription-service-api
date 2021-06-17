import * as common from "./common"
import * as practitionerRole from "./practitioner-role"
import * as extension from "./extension"

export enum EventCodingCode {
  PRESCRIPTION = "prescription-order",
  PRESCRIPTION_RESPONSE = "prescription-order-response",
  CANCELLATION = "prescription-order-update",
  DISPENSE = "dispense-notification",
  CLAIM = "dispense-claim"
}

export const ACCEPTED_MESSAGE_TYPES = [
  EventCodingCode.PRESCRIPTION,
  EventCodingCode.CANCELLATION,
  EventCodingCode.DISPENSE,
  EventCodingCode.CLAIM] as const

export const EVENT_CODING_PRESCRIPTION_ORDER_RESPONSE = common.createCoding(
  "https://fhir.nhs.uk/CodeSystem/message-event",
  EventCodingCode.PRESCRIPTION_RESPONSE,
  "Prescription Order Response"
)

export const EVENT_CODING_PRESCRIPTION_ORDER = common.createCoding(
  "https://fhir.nhs.uk/CodeSystem/message-event",
  EventCodingCode.PRESCRIPTION,
  "Prescription Order"
)

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
