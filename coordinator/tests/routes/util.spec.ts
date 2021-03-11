import {callFhirValidator, identifyMessageType, VALIDATOR_HOST} from "../../src/routes/util"
import {clone} from "../resources/test-helpers"
import * as TestResources from "../resources/test-resources"
import {getMessageHeader} from "../../src/services/translation/common/getResourcesOfType"
import axios from "axios"
import * as moxios from "moxios"
import * as fhir from "../../src/models/fhir"

test("API only forwards accept header to validator", async () => {
  moxios.install(axios)
  moxios.stubRequest(`${VALIDATOR_HOST}/$validate`, {
    status: 200,
    responseText: JSON.stringify({
      "resourceType": "OperationOutcome"
    })
  })

  const exampleHeaders = {
    "accept": "application/json+fhir",
    "content-type": "application/my-content-type"
  }

  await callFhirValidator("data", exampleHeaders)
  const requestHeaders = moxios.requests.mostRecent().headers

  expect(requestHeaders["Accept"]).not.toBe("application/json+fhir")
  expect(requestHeaders["Content-Type"]).toBe("application/my-content-type")
  moxios.uninstall(axios)
})

describe("identifyMessageType", () => {
  let bundle: fhir.Bundle
  let messageHeader: fhir.MessageHeader

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    messageHeader = getMessageHeader(bundle)
  })

  test("identifies a prescription message correctly", () => {
    const messageType = fhir.EventCodingCode.PRESCRIPTION
    messageHeader.eventCoding.code = messageType
    expect(identifyMessageType(bundle)).toBe(messageType)
  })
})
