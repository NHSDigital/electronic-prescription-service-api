import {clone} from "./test-helpers"
import * as TestResources from "./test-resources"
import {identifyMessageType} from "../../src/routes/util"
import * as fhir from "../../src/model/fhir-resources"
import {getMessageHeader} from "../../src/services/translation/common/getResourcesOfType"

describe("identifyMessageType", () => {
  let bundle: fhir.Bundle
  let messageHeader: fhir.MessageHeader

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    messageHeader = getMessageHeader(bundle)
  })

  test("identifies a prescription message correctly", () => {
    messageHeader.eventCoding.code = "prescription-order"
    expect(identifyMessageType(bundle)).toBe("Prescription")
  })
  test("identifies a cancellation message correctly", () => {
    messageHeader.eventCoding.code = "prescription-order-update"
    expect(identifyMessageType(bundle)).toBe("Cancellation")
  })
  test("throws on any other message", () => {
    messageHeader.eventCoding.code = "some-guff"
    expect(() => identifyMessageType(bundle)).toThrow()
  })
})
