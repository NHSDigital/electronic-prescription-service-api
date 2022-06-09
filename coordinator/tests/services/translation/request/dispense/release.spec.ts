import {fhir, hl7V3} from "@models"
import {
  createNominatedReleaseRequest,
  createPatientReleaseRequest,
  translateReleaseRequest
} from "../../../../../src/services/translation/request/dispense/release"
import * as testData from "../../../../resources/test-data"

const mockCreateAuthor = jest.fn()

jest.mock("../../../../../src/services/translation/request/agent-unattended", () => ({
  createAuthor: (pr: fhir.PractitionerRole, org: fhir.Organization) =>
    mockCreateAuthor(pr, org)
}))

const ownerParameter: fhir.IdentifierParameter = {
  name: "owner",
  valueIdentifier: {
    system: "https://fhir.nhs.uk/Id/ods-organization-code",
    value: "FTX40"
  }
}

const groupIdentifierParameter: fhir.IdentifierParameter = {
  name: "group-identifier",
  valueIdentifier: {
    system: "https://fhir.nhs.uk/Id/prescription-order-number",
    value: "18B064-A99968-4BCAA3"
  }
}

const agentParameter: fhir.ResourceParameter<fhir.PractitionerRole> = {
  name: "agent",
  resource: testData.practitionerRole
}

const organizationParameter: fhir.ResourceParameter<fhir.Organization> = {
  name: "organization",
  resource: testData.organization
}

describe("release functions", () => {
  const mockAuthorResponse = new hl7V3.Author()
  mockAuthorResponse.AgentPerson = new hl7V3.AgentPerson()
  mockCreateAuthor.mockReturnValue(mockAuthorResponse)

  describe("translateReleaseRequest", () => {
    test("translates release request without prescription ID to nominated release request", async () => {
      const parameters = new fhir.Parameters([ownerParameter, agentParameter, organizationParameter])
      const translatedRelease = translateReleaseRequest(parameters)

      expect(translatedRelease).toBeInstanceOf(hl7V3.NominatedPrescriptionReleaseRequestWrapper)
    })

    test("translates release request with prescription ID to patient release request", async () => {
      const parameters = new fhir.Parameters([
        ownerParameter, groupIdentifierParameter, agentParameter, organizationParameter
      ])
      const translatedRelease = translateReleaseRequest(parameters)

      expect(translatedRelease).toBeInstanceOf(hl7V3.PatientPrescriptionReleaseRequestWrapper)
    })
  })

  describe("createNominatedReleaseRequest", () => {
    test("translates info from practitionerRole and organization parameters", async () => {
      const translatedRelease = createNominatedReleaseRequest(testData.practitionerRole, testData.organization)

      expect(translatedRelease.NominatedPrescriptionReleaseRequest.author).toEqual(mockAuthorResponse)
      expect(mockCreateAuthor).toBeCalledWith(testData.practitionerRole, testData.organization)
    })
  })

  describe("createPatientReleaseRequest", () => {
    test("translates info from practitionerRole and organization parameters", async () => {
      const prescriptionId = "18B064-A99968-4BCAA3"
      const translatedRelease = createPatientReleaseRequest(
        testData.practitionerRole,
        testData.organization,
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
      expect(mockCreateAuthor).toBeCalledWith(testData.practitionerRole, testData.organization)
    })
  })
})
