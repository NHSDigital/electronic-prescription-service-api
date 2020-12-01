import {createMessageHeader} from "../../../../src/services/translation/cancellation/cancellation-message-header"
import {getExtensionForUrl} from "../../../../src/services/translation/common"
import * as fhir from "../../../../src/models/fhir/fhir-resources"

const messageIdUrl = "https://fhir.nhs.uk/StructureDefinition/Extension-Spine-MessageHeader-messageId"

describe("createMessageHeader", () => {
  const representedOrganizationId = "testIdForRepOrg"
  const messageId = "testMessageId"
  const patientReference = "testReference"
  const medicationRequestReference = "testReference2"
  const messageHeader = createMessageHeader(
    messageId,
    patientReference,
    medicationRequestReference,
    representedOrganizationId
  )

  test("has correct extension", () => {
    const messageHeaderExtensions = messageHeader.extension
    expect(messageHeaderExtensions).toHaveLength(1)
    expect(messageHeaderExtensions[0].url).toBe(messageIdUrl)
    const messageIdExtension = getExtensionForUrl(
      messageHeaderExtensions, messageIdUrl, "MessageHeader.extension"
    ) as fhir.IdentifierExtension
    expect(messageIdExtension.valueIdentifier.value).toBe(messageId.toLocaleLowerCase())
    expect(messageIdExtension.valueIdentifier.system).toBe("https://tools.ietf.org/html/rfc4122")
  })

  test("created MessageHeader has correct eventCoding", () => {
    expect(messageHeader.eventCoding.system).toBe("https://fhir.nhs.uk/CodeSystem/message-event")
    expect(messageHeader.eventCoding.code).toBe("prescription-order-response")
    expect(messageHeader.eventCoding.display).toBe("Prescription Order Response")
  })

  test("has NHSD as a sender", () => {
    expect(messageHeader.sender.identifier.system).toBe("https://fhir.nhs.uk/Id/ods-organization-code")
    expect(messageHeader.sender.identifier.value).toBe("X2601")
    expect(messageHeader.sender.display).toBe("NHS Digital Spine")
  })

  test("focus has references to Patient and MedicationRequest", () => {
    expect(messageHeader.focus).toContainEqual({reference: patientReference})
    expect(messageHeader.focus).toContainEqual({reference: medicationRequestReference})
  })

  test("source points to EPS endpoint", () => {
    expect(messageHeader.source.name).toBe("NHS Spine")
    expect(messageHeader.source.endpoint.endsWith(".api.service.nhs.uk/electronic-prescriptions/$process-message"))
      .toBeTruthy()
  })

  test("destination field has info from author.agentPerson.representedOrganisation", () => {
    expect(messageHeader.destination[0].endpoint)
      .toBe(`urn:nhs-uk:addressing:ods:${representedOrganizationId}`)
    expect(messageHeader.destination[0].receiver.identifier.system)
      .toBe("https://fhir.nhs.uk/Id/ods-organization-code")
    expect(messageHeader.destination[0].receiver.identifier.value)
      .toBe(representedOrganizationId)
  })
})
