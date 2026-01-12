import {fhir, hl7V3} from "@models"
import {
  createNominatedReleaseRequest,
  createPatientReleaseRequest,
  translateReleaseRequest
} from "../../../../../src/services/translation/request/dispense/release"
import {
  agentParameter,
  groupIdentifierParameter,
  organization,
  ownerParameter,
  practitionerRole
} from "../../../../resources/test-data"

const mockCreateAuthor = jest.fn()
jest.mock("../../../../../src/services/translation/request/agent-person", () => ({
  createAuthor: (pr: fhir.PractitionerRole, org: fhir.Organization) =>
    mockCreateAuthor(pr, org)
}))

describe("release functions", () => {
  const mockAuthorResponse = new hl7V3.Author()
  mockAuthorResponse.AgentPerson = new hl7V3.AgentPerson()
  mockCreateAuthor.mockReturnValue(mockAuthorResponse)

  describe("translateReleaseRequest", () => {
    test("translates release request without prescription ID to nominated release request", async () => {
      const parameters = new fhir.Parameters([ownerParameter, agentParameter])
      const translatedRelease = translateReleaseRequest(parameters)

      expect(translatedRelease).toBeInstanceOf(hl7V3.NominatedPrescriptionReleaseRequestWrapper)
    })

    test("translates release request with prescription ID to patient release request", async () => {
      const parameters = new fhir.Parameters([
        ownerParameter, groupIdentifierParameter, agentParameter
      ])
      const translatedRelease = translateReleaseRequest(parameters)

      expect(translatedRelease).toBeInstanceOf(hl7V3.PatientPrescriptionReleaseRequestWrapper)
    })
  })

  describe("createNominatedReleaseRequest", () => {
    test("translates info from practitionerRole and organization parameters", async () => {
      const translatedRelease = createNominatedReleaseRequest(practitionerRole, organization)

      expect(translatedRelease.NominatedPrescriptionReleaseRequest.author).toEqual(mockAuthorResponse)
      expect(mockCreateAuthor).toHaveBeenCalledWith(practitionerRole, organization)
    })
  })

  describe("createPatientReleaseRequest", () => {
    test("translates info from practitionerRole and organization parameters", async () => {
      const prescriptionId = "18B064-A99968-4BCAA3"
      const translatedRelease = createPatientReleaseRequest(
        practitionerRole,
        organization,
        prescriptionId
      )

      expect(translatedRelease.PatientPrescriptionReleaseRequest.author).toEqual(mockAuthorResponse)
      expect(
        translatedRelease
          .PatientPrescriptionReleaseRequest
          .pertinentInformation
          .pertinentPrescriptionID
          .value
          ._attributes
          .extension
      ).toEqual(prescriptionId)
      expect(mockCreateAuthor).toHaveBeenCalledWith(practitionerRole, organization)
    })
  })
})
