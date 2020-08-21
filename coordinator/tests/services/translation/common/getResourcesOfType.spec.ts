import * as TestResources from "../../../resources/test-resources"
import {
  getMedicationRequests,
  getPatient,
  getProvenances
} from "../../../../src/services/translation/common/getResourcesOfType"

describe("getResourcesOfType", () => {
  const bundle = TestResources.examplePrescription1.fhirMessageUnsigned

  test("getMedicationRequests", () => {
    const medicationRequest = getMedicationRequests(bundle)

    medicationRequest.map((medicationRequest) => expect(medicationRequest.resourceType).toBe("MedicationRequest"))
  })

  test("getPatient", () => {
    const patient = getPatient(bundle)

    expect(patient.resourceType).toBe("Patient")
  })

  test("getProvenance", () => {
    const provenances = getProvenances(bundle)

    provenances.map((provenance) => expect(provenance.resourceType).toBe("Pro"))
  })
})
