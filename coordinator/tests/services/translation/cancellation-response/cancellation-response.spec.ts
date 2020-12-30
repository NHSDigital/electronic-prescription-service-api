import * as TestResources from "../../../resources/test-resources"
import {
  translateSpineCancelResponseIntoBundle
} from "../../../../src/services/translation/cancellation/cancellation-response"
import {
  getMedicationRequests,
  getMessageHeader,
  getOrganizations,
  getPatient,
  getPractitioners,
  getPractitionerRoles
} from "../../../../src/services/translation/common/getResourcesOfType"
import {SPINE_CANCELLATION_ERROR_RESPONSE_REGEX} from "../../../../src/services/translation/spine-response"
import {readXml} from "../../../../src/services/serialisation/xml"
import {PORX50101} from "../../../../src/models/hl7-v3/hl7-v3-spine-response"
import {getCancellationResponse, hasCorrectISOFormat} from "./test-helpers"

const actualError = TestResources.spineResponses.cancellationError
const cancelResponse = SPINE_CANCELLATION_ERROR_RESPONSE_REGEX.exec(actualError.response.body)[0]
const parsedCancelResponse = readXml(cancelResponse) as PORX50101
const actualCancelResponse = getCancellationResponse(TestResources.spineResponses.cancellationError)
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
    expect(bundleIdentifier.value)
      .toBe(parsedCancelResponse["hl7:PORX_IN050101UK31"]["hl7:id"]._attributes.root.toLowerCase())
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
    expect(getPractitioners(fhirBundle)).toHaveLength(2)
  })

  test("entries contains two Organizations", () => {
    expect(getOrganizations(fhirBundle)).toHaveLength(2)
  })

  test("entries contains two PractitionerRole", () => {
    expect(getPractitionerRoles(fhirBundle)).toHaveLength(2)
  })

  test("entries contains a MedicationRequest (without dispenseRequest)", () => {
    const medicationRequests = getMedicationRequests(fhirBundle)
    expect(medicationRequests.length).toEqual(1)
    expect(medicationRequests[0].dispenseRequest).toBeUndefined()
  })

  test("entries contains a MessageHeader", () => {
    expect(() => getMessageHeader(fhirBundle)).not.toThrow()
  })

  const cancellationErrorDispensedResponse = getCancellationResponse(
    TestResources.spineResponses.cancellationDispensedError
  )
  const performerFhirBundle = translateSpineCancelResponseIntoBundle(cancellationErrorDispensedResponse)

  test("performer field in hl7 message adds performer practitioner", () => {
    const practitioners = getPractitioners(performerFhirBundle)
    const nameArray = practitioners.map(practitioner => practitioner.name[0].text)
    expect(nameArray).toContain("Taylor Paul")
  })

  test("performer field in hl7 message adds performer practitionerRole", () => {
    const practitionerRoles = getPractitionerRoles(performerFhirBundle)
    const codeArray = practitionerRoles.map(practitionerRole => practitionerRole.code[0].coding[0].code)
    expect(codeArray).toContain("S8000:G8000:R8003")
  })

  test("performer field in hl7 message adds performer organization", () => {
    const organizations = getOrganizations(performerFhirBundle)
    const codeArray = organizations.map(organization => organization.name)
    expect(codeArray).toContain("CRx PM Chetna2 EPS")
  })

  test("performer field in hl7 message adds dispense reference to MedicationRequest", () => {
    expect(getMedicationRequests(performerFhirBundle)[0].dispenseRequest).toBeDefined()
  })
})
