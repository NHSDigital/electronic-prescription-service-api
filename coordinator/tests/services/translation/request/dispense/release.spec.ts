import { fhir, hl7V3 } from "@models"
import {
  createNominatedReleaseRequest,
  createPatientReleaseRequest,
  translateReleaseRequest
} from "../../../../../src/services/translation/request/dispense/release"
import pino from "pino"

const logger = pino()

const mockTelecom = {
  system: "phone",
  value: "02380798431",
  use: "work"
}

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
    "identifier": {
      "system": "https://fhir.hl7.org.uk/Id/gphc-number",
      "value": "1231234"
    },
    display: "Jackie Clark"
  },
  organization: {
    "reference": "Organization/organization"
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
  telecom: [mockTelecom]
}

const organization: fhir.Organization = {
  resourceType: "Organization",
  id: "organization",
  identifier: [
    {
      system: "https://fhir.nhs.uk/Id/ods-organization-code",
      value: "VNE51"
    }
  ],
  address: [
    {
      city: "West Yorkshire",
      use: "work",
      line: [
        "17 Austhorpe Road",
        "Crossgates",
        "Leeds"
      ],
      "postalCode": "LS15 8BA"
    }
  ],
  type: [
    {
      coding: [
        {
          system: "https://fhir.nhs.uk/CodeSystem/organisation-role",
          code: "182",
          display: "PHARMACY"
        }
      ]
    }
  ],
  name: "The Simple Pharmacy",
  telecom: [
    {
      system: "phone",
      use: "work",
      value: "0113 3180277"
    }
  ]
}

const agentParameter: fhir.ResourceParameter<fhir.PractitionerRole> = {
  name: "agent",
  resource: practitionerRole
}

const organizationParameter: fhir.ResourceParameter<fhir.Organization> = {
  name: "organization",
  resource: organization
}

describe("release functions", () => {
  const mockAuthorResponse = new hl7V3.Author()
  mockAuthorResponse.AgentPerson = new hl7V3.AgentPerson()

  describe("translateReleaseRequest", () => {
    test("translates release request without prescription ID to nominated release request", async () => {
      const parameters = new fhir.Parameters([ownerParameter, agentParameter, organizationParameter])
      const translatedRelease = await translateReleaseRequest(parameters, {}, logger)

      expect(translatedRelease).toBeInstanceOf(hl7V3.NominatedPrescriptionReleaseRequestWrapper)
    })

    test("translates release request with prescription ID to patient release request", async () => {
      const parameters = new fhir.Parameters([ownerParameter, groupIdentifierParameter, agentParameter, organizationParameter])
      const translatedRelease = await translateReleaseRequest(parameters, {}, logger)

      expect(translatedRelease).toBeInstanceOf(hl7V3.PatientPrescriptionReleaseRequestWrapper)
    })
  })

  describe("createNominatedReleaseRequest", () => {
    const OLD_ENV = process.env

    beforeEach(() => {
      jest.resetModules()
      process.env = { ...OLD_ENV }
    })

    afterAll(() => {
      process.env = OLD_ENV
    })

    test("populates author details from headers when user auth", async () => {
      const parameters = new fhir.Parameters([ownerParameter, groupIdentifierParameter, agentParameter, organizationParameter])
      const translatedRelease = await createNominatedReleaseRequest(parameters, logger)

      expect(translatedRelease.NominatedPrescriptionReleaseRequest.author).toEqual(mockAuthorResponse)
    })

    test("app auth has author details from within message (agent parameter)", async () => {
      process.env.SANDBOX = "0"
      const parameters = new fhir.Parameters([ownerParameter, groupIdentifierParameter, agentParameter, organizationParameter])
      const translatedRelease = await createNominatedReleaseRequest(parameters, logger)

      expect(translatedRelease.NominatedPrescriptionReleaseRequest.author).toEqual(mockAuthorResponse)
    })
  })

  describe("createPatientReleaseRequest", () => {
    test("translated patient release contains prescription ID and author details from ODS", async () => {
      const translatedRelease = await createPatientReleaseRequest(
        "FTX40",
        "18B064-A99968-4BCAA3",
        undefined,
        mockTelecom,
        logger
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
      ).toEqual("18B064-A99968-4BCAA3")
    })
  })
})
