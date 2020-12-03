import * as TestResources from "../../../resources/test-resources"
import {
  translateSpineCancelResponseIntoBundle
} from "../../../../src/services/translation/cancellation/cancellation-response"
import {
  getMedicationRequests, getMessageHeader,
  getOrganizations,
  getPatient, getPractitioner, getPractitionerRole
} from "../../../../src/services/translation/common/getResourcesOfType"
import {SPINE_CANCELLATION_ERROR_RESPONSE_REGEX} from "../../../../src/services/translation/spine-response"
import {readXml} from "../../../../src/services/serialisation/xml"
import {
  CancellationResponse,
  PORX50101
} from "../../../../src/models/hl7-v3/hl7-v3-spine-response"
import {hasCorrectISOFormat} from "./test-helpers"

const actualError = TestResources.spineResponses.cancellationError
const cancelResponse = SPINE_CANCELLATION_ERROR_RESPONSE_REGEX.exec(actualError.response.body)[0]
const parsedCancelResponse = readXml(cancelResponse) as PORX50101
const controlActEvent = parsedCancelResponse["hl7:PORX_IN050101UK31"]["hl7:ControlActEvent"]
const actualCancelResponse = controlActEvent["hl7:subject"].CancellationResponse as CancellationResponse
const fhirBundle = translateSpineCancelResponseIntoBundle(actualCancelResponse)

describe("bundle", () => {
  test("response is a bundle", () => {
    expect(fhirBundle.resourceType).toBe("Bundle")
  })

  test("bundle has type", () => {
    expect(fhirBundle.type).toBe("message")
  })

  test("bundle has identifier", () => {
    const bundleIdentifier = fhirBundle.identifier
    expect(bundleIdentifier.system).toBe("https://tools.ietf.org/html/rfc4122")
    expect(bundleIdentifier.value).toBe(parsedCancelResponse["hl7:PORX_IN050101UK31"]["hl7:id"]._attributes.root)
  })

  test("bundle has correct timestamp format", () => {
    expect(hasCorrectISOFormat(fhirBundle.timestamp)).toBe(true)
  })
})

describe("bundle entries", () => {
  test("bundle contains entries", () => {
    expect(fhirBundle.entry.length).toBeGreaterThan(0)
  })

  test("response bundle entries contains a Patient", () => {
    expect(() => getPatient(fhirBundle)).not.toThrow()
  })

  test("entries contains two Practitioner", () => {
    expect(getPractitioner(fhirBundle)).toHaveLength(2)
  })

  test("entries contains two Organizations", () => {
    expect(getOrganizations(fhirBundle)).toHaveLength(2)
  })

  test("entries contains two PractitionerRole", () => {
    expect(getPractitionerRole(fhirBundle)).toHaveLength(2)
  })

  test("entries contains a MedicationRequest", () => {
    expect(getMedicationRequests(fhirBundle).length).toBeGreaterThan(0)
  })

  test("entries contains a MessageHeader", () => {
    expect(() => getMessageHeader(fhirBundle)).not.toThrow()
  })
})
