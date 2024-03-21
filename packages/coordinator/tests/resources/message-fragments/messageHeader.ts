import {fhir} from "@models"
import {EventCodingCode} from "../../../../models/fhir"

const messageHeader: fhir.MessageHeader = {
  resourceType: "MessageHeader",
  eventCoding: {
    system: "https://fhir.nhs.uk/CodeSystem/message-event",
    code: EventCodingCode.PRESCRIPTION,
    display: "Prescription Order"
  },
  source: {
    endpoint: "https://directory.spineservices.nhs.uk/STU3/Organization/A83008"
  },
  focus: [],
  sender: {
    identifier: {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: "A83008"
    },
    display: "HALLGARTH SURGERY"
  }
}

const messageHeaders = new Map<string, fhir.MessageHeader>([
  ["messageHeader", messageHeader]
])

export default messageHeaders
