import {fhir, hl7V3} from "@models"
import {
  createNominatedReleaseRequest,
  createPatientReleaseRequest,
  translateReleaseRequest
} from "../../../../../src/services/translation/request/dispense/release"
import pino from "pino"
import {
  createAuthorFromAuthenticatedUserDetails,
  createAuthorFromPractitionerRole
} from "../../../../../src/services/translation/request/agent-unattended"

const logger = pino()

jest.mock("../../../../../src/services/translation/request/agent-unattended", () => ({
  createAuthorFromAuthenticatedUserDetails: jest.fn(),
  createAuthorFromPractitionerRole: jest.fn()
}))

const mockTelecomValue = "02380798431"

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

const practitionerRole: fhir.PractitionerRole = {
  resourceType: "PractitionerRole",
  id: "16708936-6397-4e03-b84f-4aaa790633e0",
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
      value: "555086415105"
    }
  ],
  practitioner: {
    identifier: {
      system: "https://fhir.nhs.uk/Id/sds-user-id",
      value: "3415870201"
    },
    display: "Jackie Clark"
  },
  organization: {
    identifier: {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: "RHM"
    },
    display: "UNIVERSITY HOSPITAL SOUTHAMPTON NHS FOUNDATION TRUST"
  },
  code: [
    {
      coding: [
        {
          system: "https://fhir.hl7.org.uk/CodeSystem/UKCore-SDSJobRoleName",
          code: "R8000",
          display: "Clinical Practitioner Access Role"
        }
      ]
    }
  ],
  telecom: [
    {
      system: "phone",
      value: mockTelecomValue,
      use: "work"
    }
  ]
}

const agentParameter: fhir.ResourceParameter<fhir.PractitionerRole> = {
  name: "agent",
  resource: practitionerRole
}

describe("release functions", () => {
  const mockAuthorResponse = new hl7V3.Author()
  mockAuthorResponse.AgentPerson = new hl7V3.AgentPerson()
  const mockAuthorFromUserFunction = createAuthorFromAuthenticatedUserDetails as jest.Mock
  const mockAuthorFromPractitionerFunction = createAuthorFromPractitionerRole as jest.Mock
  const mockPractitionerRole = practitionerRole

  beforeEach(() => {
    jest.clearAllMocks()
    mockAuthorFromUserFunction.mockReturnValueOnce(Promise.resolve(mockAuthorResponse))
    mockAuthorFromPractitionerFunction.mockReturnValueOnce(Promise.resolve(mockAuthorResponse))
  })

  describe("translateReleaseRequest", () => {
    test("translates release request without prescription ID to nominated release request", async () => {
      const parameters = new fhir.Parameters([ownerParameter, agentParameter])
      const translatedRelease = await translateReleaseRequest(parameters, {}, logger)

      expect(mockAuthorFromUserFunction).toHaveBeenCalledWith("FTX40", {}, logger, mockTelecomValue)
      expect(translatedRelease).toBeInstanceOf(hl7V3.NominatedPrescriptionReleaseRequestWrapper)
    })

    test("translates release request with prescription ID to patient release request", async () => {
      const parameters = new fhir.Parameters([ownerParameter, groupIdentifierParameter, agentParameter])
      const translatedRelease = await translateReleaseRequest(parameters, {}, logger)

      expect(mockAuthorFromUserFunction).toHaveBeenCalledWith("FTX40", {}, logger)
      expect(translatedRelease).toBeInstanceOf(hl7V3.PatientPrescriptionReleaseRequestWrapper)
    })
  })

  describe("createNominatedReleaseRequest", () => {
    const OLD_ENV = process.env

    beforeEach(() => {
      jest.resetModules()
      process.env = {...OLD_ENV}
    })

    afterAll(() => {
      process.env = OLD_ENV
    })

    test("populates author details from headers when user auth", async () => {
      const translatedRelease = await createNominatedReleaseRequest("FTX40", {}, mockPractitionerRole, logger)

      expect(mockAuthorFromUserFunction).toHaveBeenCalledWith("FTX40", {}, logger, mockTelecomValue)
      expect(mockAuthorFromPractitionerFunction).toHaveBeenCalledTimes(0)
      expect(translatedRelease.NominatedPrescriptionReleaseRequest.author).toEqual(mockAuthorResponse)
    })

    test("app auth has author details from within message (agent parameter)", async () => {
      process.env.SANDBOX = "0"
      const translatedRelease = await createNominatedReleaseRequest("FTX40", {}, mockPractitionerRole, logger)

      expect(mockAuthorFromPractitionerFunction).toHaveBeenCalledWith(mockPractitionerRole, logger)
      expect(mockAuthorFromUserFunction).toHaveBeenCalledTimes(0)
      expect(translatedRelease.NominatedPrescriptionReleaseRequest.author).toEqual(mockAuthorResponse)
    })
  })

  describe("createPatientReleaseRequest", () => {
    test("translated patient release contains prescription ID and author details from ODS", async () => {
      const translatedRelease = await createPatientReleaseRequest("FTX40", "18B064-A99968-4BCAA3", undefined, logger)

      expect(mockAuthorFromUserFunction).toHaveBeenCalledWith("FTX40", undefined, logger)
      expect(translatedRelease.PatientPrescriptionReleaseRequest.author).toEqual(mockAuthorResponse)
      expect(
        translatedRelease
          .PatientPrescriptionReleaseRequest
          .pertinentInformation
          .pertinentPrescriptionID
          .value
          ._attributes
          .extension
      ).toEqual("18B064-A99968-4BCAA3")
    })
  })
})
