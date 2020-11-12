import {asOperationOutcome, fhirValidation, identifyMessageType, MessageType} from "../../src/routes/util"
import * as fhir from "../../src/models/fhir/fhir-resources"
import {clone} from "../resources/test-helpers"
import * as TestResources from "../resources/test-resources"
import {getMessageHeader} from "../../src/services/translation/common/getResourcesOfType"
import axios from "axios"
import moxios from "moxios"

describe("asOperationOutcome", () => {

  beforeEach(() => {
    moxios.install(axios)
  })

  afterEach(() => {
    moxios.uninstall(axios)
  })

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

  test("API only sends content-type header to validator", async () => {
    moxios.stubRequest("http://localhost:9001/$validate", {
      status: 200,
      responseText: JSON.stringify({
        "resourceType": "OperationOutcome"
      })
    })

    const exampleHeaders = {
      "accept": "application/json+fhir",
      "content-type": "application/my-content-type"
    }

    await fhirValidation("data", exampleHeaders)
    const requestHeaders = moxios.requests.mostRecent().headers

    expect(requestHeaders["Accept"]).not.toBe("application/json+fhir")
    expect(requestHeaders["Content-Type"]).toBe("application/my-content-type")
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
