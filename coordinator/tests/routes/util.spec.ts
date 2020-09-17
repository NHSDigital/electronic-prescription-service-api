import {asOperationOutcome, identifyMessageType, MessageType} from "../../src/routes/util"
import * as fhir from "../../src/model/fhir-resources"
import {clone} from "../resources/test-helpers"
import * as TestResources from "../resources/test-resources"
import {getMessageHeader} from "../../src/services/translation/common/getResourcesOfType"

describe("asOperationOutcome", () => {
  const operationOutcome = {
    resourceType: "OperationOutcome",
    issue: [{
      severity: "fatal",
      code: "invalid",
      details: {
        coding: [{
          system: "system",
          version: "version",
          code: "code",
          display: "display"
        }]
      }
    }]
  }

  test("returns input if body is already an OperationOutcome", () => {
    const result = asOperationOutcome({
      statusCode: 400,
      body: operationOutcome
    })
    expect(result).toBe(operationOutcome)
  })

  test("returns OperationOutcome if body is a string", () => {
    const result = asOperationOutcome({
      statusCode: 400,
      body: "Something went terribly wrong"
    })
    expect(result).toEqual({
      resourceType: "OperationOutcome",
      issue: [{
        severity: "error",
        code: "invalid",
        diagnostics: "Something went terribly wrong"
      }]
    })
  })
})

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
