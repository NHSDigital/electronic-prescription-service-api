import {clone} from "./test-helpers"
import * as TestResources from "./test-resources"
import {identifyMessageType, MessageType} from "../../src/routes/util"
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
    const messageType = MessageType.PRESCRIPTION
    messageHeader.eventCoding.code = messageType
    expect(identifyMessageType(bundle)).toBe(messageType)
  })
})
