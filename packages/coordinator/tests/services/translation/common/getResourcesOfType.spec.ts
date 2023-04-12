import {fhir} from "@models"
import * as getResources from "../../../../src/services/translation/common/getResourcesOfType"
import * as TestResources from "../../../resources/test-resources"
import {
  addEmptyCommunicationRequestToBundle,
  addEmptyHealthcareServiceToBundle,
  addEmptyLocationToBundle
} from "../../../resources/test-helpers"

describe("getResourcesOfType", () => {
  const bundle = TestResources.specification[0].fhirMessageSigned
  const dispenseBundle = TestResources.specification[2].fhirMessageDispense
  const medicationDispense = dispenseBundle.entry[1].resource as fhir.MedicationDispense

  test("getMessageHeader", () => {
    const messageHeader = getResources.getMessageHeader(bundle)

    expect(messageHeader.resourceType).toBe("MessageHeader")
  })

  test("getMedicationRequests", () => {
    const medicationRequests = getResources.getMedicationRequests(bundle)

    expect(medicationRequests.length).toBeGreaterThan(0)
    medicationRequests.forEach((medicationRequest) => expect(medicationRequest.resourceType).toBe("MedicationRequest"))
  })

  test("getCommunicationRequests", () => {
    addEmptyCommunicationRequestToBundle(bundle)
    const communicationRequests = getResources.getCommunicationRequests(bundle)

    expect(communicationRequests.length).toBeGreaterThan(0)
    communicationRequests.forEach((communicationRequest) =>
      expect(communicationRequest.resourceType).toBe("CommunicationRequest")
    )
  })

  test("getPatient", () => {
    const patient = getResources.getPatient(bundle)

    expect(patient.resourceType).toBe("Patient")
  })

  test("getOrganizations", () => {
    const organizations = getResources.getOrganizations(bundle)

    expect(organizations.length).toBeGreaterThan(0)
    organizations.forEach((organizations) => expect(organizations.resourceType).toBe("Organization"))
  })

  test("getProvenances", () => {
    const provenances = getResources.getProvenances(bundle)

    expect(provenances.length).toBeGreaterThan(0)
    provenances.forEach((provenance) => expect(provenance.resourceType).toBe("Provenance"))
  })

  test("getHealthcareServices", () => {
    addEmptyHealthcareServiceToBundle(bundle)
    const healthcareServices = getResources.getHealthcareServices(bundle)

    expect(healthcareServices.length).toBeGreaterThan(0)
    healthcareServices.forEach((healthcareService) => expect(healthcareService.resourceType).toBe("HealthcareService"))
  })

  test("getLocations", () => {
    addEmptyLocationToBundle(bundle)
    const locations = getResources.getLocations(bundle)

    expect(locations.length).toBeGreaterThan(0)
    locations.forEach((location) => expect(location.resourceType).toBe("Location"))
  })

  describe("getContainedMedicationRequest", () => {
    describe("when passed a MedicationDispense and a correct reference", () => {
      const medicationRequestReference = "#m1"
      const output = getResources.getContainedMedicationRequestViaReference(
        medicationDispense,
        medicationRequestReference
      )

      it("should return a MedicationRequest", () => {
        expect(output.resourceType).toEqual("MedicationRequest")
      })

      it("should return the correct reference", () => {
        expect(output.id).toEqual("m1")
      })
    })

    describe("when passed a MedicationDispense and a incorrect reference", () => {
      const medicationRequestReference = "#m2"

      it("should throw the correct error", () => {
        expect(() =>
          getResources.getContainedMedicationRequestViaReference(medicationDispense, medicationRequestReference)
        ).toThrow("Contained resource with reference #m2 not found")
      })
    })

    describe("when passed a MedicationDispense a reference for a resource that is not a MedicationRequest", () => {
      const medicationRequestReference = "#performer"

      it("should throw the correct error", () => {
        expect(() =>
          getResources.getContainedMedicationRequestViaReference(medicationDispense, medicationRequestReference)
        ).toThrow("Contained resource with reference #performer is not of type MedicationRequest")
      })
    })
  })

  describe("getContainedPractitionerRole", () => {
    describe("when passed a MedicationDispense and a correct reference", () => {
      const practitionerRoleReference = "#performer"
      const output = getResources.getContainedPractitionerRoleViaReference(
        medicationDispense,
        practitionerRoleReference
      )

      it("should return a PractitionerRole", () => {
        expect(output.resourceType).toEqual("PractitionerRole")
      })

      it("should return the correct reference", () => {
        expect(output.id).toEqual("performer")
      })
    })

    describe("when passed a MedicationDispense and a incorrect reference", () => {
      const practitionerRoleReference = "#performer2"

      it("should throw the correct error", () => {
        expect(() =>
          getResources.getContainedPractitionerRoleViaReference(medicationDispense, practitionerRoleReference)
        ).toThrow("Contained resource with reference #performer2 not found")
      })
    })

    describe("when passed a MedicationDispense a reference for a resource that is not a PractitionerRole", () => {
      const practitionerRoleReference = "#m1"

      it("should throw the correct error", () => {
        expect(() =>
          getResources.getContainedPractitionerRoleViaReference(medicationDispense, practitionerRoleReference)
        ).toThrow("Contained resource with reference #m1 is not of type PractitionerRole")
      })
    })
  })
})

describe("getContainedOrganization", () => {
  const organizationId = "test"
  const practitionerRoleId = "dog"
  const organization: fhir.Organization = {
    resourceType: "Organization",
    id: organizationId
  }
  const practitionerRole: fhir.PractitionerRole = {
    resourceType: "PractitionerRole",
    id: practitionerRoleId,
    telecom: []
  }
  const patient: fhir.Patient = {
    resourceType: "Patient",
    contained: [organization, practitionerRole]
  }
  describe("when passed a Patient and a correct reference", () => {
    const output = getResources.getContainedOrganizationViaReference(patient, `#${organizationId}`)

    it("should return an Organization", () => {
      expect(output.resourceType).toEqual("Organization")
    })

    it("should return the correct reference", () => {
      expect(output.id).toEqual(organizationId)
    })
  })

  describe("when passed a Patient and a incorrect reference", () => {
    const incorrectReference = "#test2"

    it("should throw the correct error", () => {
      expect(() => getResources.getContainedOrganizationViaReference(patient, incorrectReference)).toThrow(
        "Contained resource with reference #test2 not found"
      )
    })
  })

  describe("when passed a Patient a reference for a resource that is not a Organization", () => {
    it("should throw the correct error", () => {
      expect(() => getResources.getContainedOrganizationViaReference(patient, `#${practitionerRoleId}`)).toThrow(
        "Contained resource with reference #dog is not of type Organization"
      )
    })
  })
})
