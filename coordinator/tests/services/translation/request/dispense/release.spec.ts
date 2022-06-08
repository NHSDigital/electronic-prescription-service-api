import {fhir, hl7V3} from "@models"
import {
  createNominatedReleaseRequest,
  createPatientReleaseRequest,
  translateReleaseRequest
} from "../../../../../src/services/translation/request/dispense/release"
import pino from "pino"

const logger = pino()

const mockCreateAuthor = jest.fn()

jest.mock("../../../../../src/services/translation/request/agent-unattended", () => ({
  createAuthor: (pr: fhir.PractitionerRole, org: fhir.Organization, logger: pino.Logger) =>
    mockCreateAuthor(pr, org, logger)
}))

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
    identifier: {
      "system": "https://fhir.hl7.org.uk/Id/gphc-number",
      "value": "1231234"
    },
    display: "Jackie Clark"
  },
  organization: {
    reference: "Organization/organization"
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
  mockCreateAuthor.mockReturnValue(mockAuthorResponse)

  describe("translateReleaseRequest", () => {
    test("translates release request without prescription ID to nominated release request", async () => {
      const parameters = new fhir.Parameters([ownerParameter, agentParameter, organizationParameter])
      const translatedRelease = translateReleaseRequest(parameters, logger)

      expect(translatedRelease).toBeInstanceOf(hl7V3.NominatedPrescriptionReleaseRequestWrapper)
    })

    test("translates release request with prescription ID to patient release request", async () => {
      const parameters = new fhir.Parameters([
        ownerParameter, groupIdentifierParameter, agentParameter, organizationParameter
      ])
      const translatedRelease = translateReleaseRequest(parameters, logger)

      expect(translatedRelease).toBeInstanceOf(hl7V3.PatientPrescriptionReleaseRequestWrapper)
    })
  })

  describe("createNominatedReleaseRequest", () => {
    test("translates info from practitionerRole and organization parameters", async () => {
      const translatedRelease = createNominatedReleaseRequest(practitionerRole, organization, logger)

      expect(translatedRelease.NominatedPrescriptionReleaseRequest.author).toEqual(mockAuthorResponse)
      expect(mockCreateAuthor).toBeCalledWith(practitionerRole, organization, logger)
    })
  })

  describe("createPatientReleaseRequest", () => {
    test("translates info from practitionerRole and organization parameters", async () => {
      const prescriptionId = "18B064-A99968-4BCAA3"
      const translatedRelease = createPatientReleaseRequest(practitionerRole, organization, prescriptionId, logger)

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
      expect(mockCreateAuthor).toBeCalledWith(practitionerRole, organization, logger)
    })
  })
})
