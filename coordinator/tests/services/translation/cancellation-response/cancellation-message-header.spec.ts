import {createMessageHeader} from "../../../../src/services/translation/cancellation/cancellation-message-header"

describe("createMessageHeader", () => {
  const patientReference = "testReference"
  const medicationRequestReference = "testReference2"
  const messageHeader = createMessageHeader(patientReference, medicationRequestReference)

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
})
