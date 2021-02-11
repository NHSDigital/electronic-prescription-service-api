import * as TestResources from "../../../resources/test-resources"
import {
  translateSpineCancelResponseIntoBundle
} from "../../../../src/services/translation/incoming/cancellation/cancellation-response"
import {
  getHealthcareServices,
  getLocations,
  getMedicationRequests,
  getMessageHeader,
  getPatient,
  getPractitionerRoles,
  getPractitioners
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

  test("entries contains a MessageHeader", () => {
    expect(() => getMessageHeader(fhirBundle)).not.toThrow()
  })

  test("the first entry is a MessageHeader", () => {
    expect(fhirBundle.entry[0].resource.resourceType).toBe("MessageHeader")
  })

  test("response bundle entries contains a Patient", () => {
    expect(() => getPatient(fhirBundle)).not.toThrow()
  })

  test("entries contains two Practitioner", () => {
    expect(getPractitioners(fhirBundle)).toHaveLength(2)
  })

  test("entries contains two HealthcareServices", () => {
    expect(getHealthcareServices(fhirBundle)).toHaveLength(2)
  })

  test("entries contains two Locations", () => {
    expect(getLocations(fhirBundle)).toHaveLength(2)
  })

  test("entries contains two PractitionerRole", () => {
    expect(getPractitionerRoles(fhirBundle)).toHaveLength(2)
  })

  test("entries contains a MedicationRequest (without dispenseRequest)", () => {
    const medicationRequests = getMedicationRequests(fhirBundle)
    expect(medicationRequests.length).toEqual(1)
    expect(medicationRequests[0].dispenseRequest).toBeUndefined()
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

  test("performer field in hl7 message adds performer location", () => {
    const locations = getLocations(performerFhirBundle)
    const postcodes = locations.map(location => location.address.postalCode)
    expect(postcodes).toContain("PR26 7QN")
  })

  test("performer field in hl7 message adds performer healthcareService", () => {
    const healthcareServices = getHealthcareServices(performerFhirBundle)
    const healthcareServiceNames = healthcareServices.map(healthcareService => healthcareService.name)
    expect(healthcareServiceNames).toContain("CRx PM Chetna2 EPS")
  })

  test("performer field in hl7 message adds dispense reference to MedicationRequest", () => {
    expect(getMedicationRequests(performerFhirBundle)[0].dispenseRequest).toBeDefined()
  })

  test("entries are not duplicated", () => {
    const dispenseError = getCancellationResponse(TestResources.spineResponses.cancellationDispensedError)
    dispenseError.performer = dispenseError.author
    dispenseError.responsibleParty = dispenseError.author
    const translatedDispenseBundle = translateSpineCancelResponseIntoBundle(dispenseError)
    expect(getPractitioners(translatedDispenseBundle)).toHaveLength(1)
    expect(getPractitionerRoles(translatedDispenseBundle)).toHaveLength(1)
    expect(getHealthcareServices(translatedDispenseBundle)).toHaveLength(1)
    expect(getLocations(translatedDispenseBundle)).toHaveLength(1)
  })
})
