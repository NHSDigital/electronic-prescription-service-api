import {createMessageHeader} from "../../../../src/services/translation/incoming/message-header"
import {getExtensionForUrl} from "../../../../src/services/translation/common"
import * as fhir from "../../../../src/models/fhir/fhir-resources"

const messageIdUrl = "https://fhir.nhs.uk/StructureDefinition/Extension-Spine-MessageHeader-messageId"

describe("createMessageHeader", () => {
  const representedOrganizationId = "testIdForRepOrg"
  const messageId = "testMessageId"
  const patientReference = "testReference"
  const medicationRequestReference = "testReference2"
  const cancelRequestId = "testCancelId"
  const messageHeader = createMessageHeader(
    messageId,
    patientReference,
    medicationRequestReference,
    representedOrganizationId,
    cancelRequestId
  )

  test("has correct extension", () => {
    const messageHeaderExtensions = messageHeader.extension
    expect(messageHeaderExtensions).toHaveLength(1)
    expect(messageHeaderExtensions[0].url).toBe(messageIdUrl)
    const messageIdExtension = getExtensionForUrl(
      messageHeaderExtensions, messageIdUrl, "MessageHeader.extension"
    ) as fhir.IdentifierExtension
    expect(messageIdExtension.valueIdentifier.value).toBe(messageId.toLowerCase())
    expect(messageIdExtension.valueIdentifier.system).toBe("https://tools.ietf.org/html/rfc4122")
  })

  test("created MessageHeader has correct eventCoding", () => {
    const eventCoding = messageHeader.eventCoding
    expect(eventCoding.system).toBe("https://fhir.nhs.uk/CodeSystem/message-event")
    expect(eventCoding.code).toBe("prescription-order-response")
    expect(eventCoding.display).toBe("Prescription Order Response")
  })

  test("has NHSD as a sender", () => {
    const sender = messageHeader.sender
    expect(sender.identifier.system).toBe("https://fhir.nhs.uk/Id/ods-organization-code")
    expect(sender.identifier.value).toBe("X2601")
  })

  test("focus has references to Patient and MedicationRequest", () => {
    const focus = messageHeader.focus
    expect(focus).toContainEqual({reference: `urn:uuid:${patientReference}`})
    expect(focus).toContainEqual({reference: `urn:uuid:${medicationRequestReference}`})
  })

  test("source points to EPS endpoint", () => {
    const source = messageHeader.source
    expect(source.name).toBe("NHS Spine")
    expect(source.endpoint.endsWith("/$process-message"))
      .toBeTruthy()
  })

  test("destination field has info from author.agentPerson.representedOrganisation", () => {
    const destinations = messageHeader.destination
    expect(destinations).toHaveLength(1)
    expect(messageHeader.destination[0].endpoint)
      .toBe(`urn:nhs-uk:addressing:ods:${representedOrganizationId}`)
    expect(messageHeader.destination[0].receiver.identifier.system)
      .toBe("https://fhir.nhs.uk/Id/ods-organization-code")
    expect(messageHeader.destination[0].receiver.identifier.value)
      .toBe(representedOrganizationId)
  })

  test("response is correct", () => {
    const response = messageHeader.response
    expect(response.identifier).toBe(cancelRequestId.toLowerCase())
  })
})
