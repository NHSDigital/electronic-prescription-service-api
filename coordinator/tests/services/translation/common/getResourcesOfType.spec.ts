import * as TestResources from "../../../resources/test-resources"
import {
  getCommunicationRequests,
  getMedicationRequests, getOrganizations,
  getPatient,
  getProvenances
} from "../../../../src/services/translation/common/getResourcesOfType"
import {addEmptyCommunicationRequestToBundle} from "../../../resources/test-helpers"

describe("getResourcesOfType", () => {
  const bundle = TestResources.examplePrescription1.fhirMessageSigned
  addEmptyCommunicationRequestToBundle(bundle)

  test("getMedicationRequests", () => {
    const medicationRequests = getMedicationRequests(bundle)

    expect(medicationRequests.length).toBeGreaterThan(0)
    medicationRequests.map((medicationRequest) => expect(medicationRequest.resourceType).toBe("MedicationRequest"))
  })

  test("getCommunicationRequests", () => {
    const communicationRequests = getCommunicationRequests(bundle)

    expect(communicationRequests.length).toBeGreaterThan(0)
    communicationRequests.map((communicationRequest) => expect(communicationRequest.resourceType).toBe("CommunicationRequest"))
  })

  test("getPatient", () => {
    const patient = getPatient(bundle)

    expect(patient.resourceType).toBe("Patient")
  })

  test("getOrganizations", () => {
    const organizations = getOrganizations(bundle)

    expect(organizations.length).toBeGreaterThan(0)
    organizations.map((organizations) => expect(organizations.resourceType).toBe("Organization"))
  })

  test("getProvenances", () => {
    const provenances = getProvenances(bundle)

    expect(provenances.length).toBeGreaterThan(0)
    provenances.map((provenance) => expect(provenance.resourceType).toBe("Provenance"))
  })
})
