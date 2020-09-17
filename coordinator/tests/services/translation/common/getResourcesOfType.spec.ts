import * as getResources from "../../../../src/services/translation/common/getResourcesOfType"
import * as TestResources from "../../../resources/test-resources"
import {
  addEmptyCommunicationRequestToBundle,
  addEmptyHealthcareServiceToBundle,
  addEmptyLocationToBundle
} from "../../../resources/test-helpers"

describe("getResourcesOfType", () => {
  const bundle = TestResources.examplePrescription1.fhirMessageSigned

  test("getMessageHeader", () => {
    const messageHeader = getResources.getMessageHeader(bundle)

    expect(messageHeader.resourceType).toBe("MessageHeader")
  })

  test("getMedicationRequests", () => {
    const medicationRequests = getResources.getMedicationRequests(bundle)

    expect(medicationRequests.length).toBeGreaterThan(0)
    medicationRequests.map(
      (medicationRequest) => expect(medicationRequest.resourceType).toBe("MedicationRequest")
    )
  })

  test("getCommunicationRequests", () => {
    addEmptyCommunicationRequestToBundle(bundle)
    const communicationRequests = getResources.getCommunicationRequests(bundle)

    expect(communicationRequests.length).toBeGreaterThan(0)
    communicationRequests.map(
      (communicationRequest) =>
        expect(communicationRequest.resourceType).toBe("CommunicationRequest"))
  })

  test("getPatient", () => {
    const patient = getResources.getPatient(bundle)

    expect(patient.resourceType).toBe("Patient")
  })

  test("getOrganizations", () => {
    const organizations = getResources.getOrganizations(bundle)

    expect(organizations.length).toBeGreaterThan(0)
    organizations.map((organizations) => expect(organizations.resourceType).toBe("Organization"))
  })

  test("getProvenances", () => {
    const provenances = getResources.getProvenances(bundle)

    expect(provenances.length).toBeGreaterThan(0)
    provenances.map((provenance) => expect(provenance.resourceType).toBe("Provenance"))
  })

  test("getHealthcareServices", () => {
    addEmptyHealthcareServiceToBundle(bundle)
    const healthcareServices = getResources.getHealthcareServices(bundle)

    expect(healthcareServices.length).toBeGreaterThan(0)
    healthcareServices.map(
      (healthcareService) =>
        expect(healthcareService.resourceType).toBe("HealthcareService")
    )
  })

  test("getLocations", () => {
    addEmptyLocationToBundle(bundle)
    const locations = getResources.getLocations(bundle)

    expect(locations.length).toBeGreaterThan(0)
    locations.map((location) => expect(location.resourceType).toBe("Location"))
  })
})
