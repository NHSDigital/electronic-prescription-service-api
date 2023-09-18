import * as practitioner from "../../../../../src/services/translation/request/cancel/cancellation"
import * as helpers from "../../../../resources/test-helpers"
import * as TestResources from "../../../../resources/test-resources"
import * as common from "../../../../../src/services/translation/common/getResourcesOfType"
import {getMessageHeader} from "../../../../../src/services/translation/common/getResourcesOfType"
import {fhir, hl7V3} from "@models"
import {MomentFormatSpecification, MomentInput} from "moment"
import requireActual = jest.requireActual

const actualMoment = requireActual("moment")
jest.mock("moment", () => ({
  utc: (input?: MomentInput, format?: MomentFormatSpecification) =>
    actualMoment.utc(input || "2020-12-18T12:34:34Z", format)
}))

describe("getAgentPersonTelecom", () => {
  const roleTelecom: Array<fhir.ContactPoint> = [
    {
      system: "phone",
      value: "tel:01512631737",
      use: "work"
    }
  ]
  const practitionerTelecom: Array<fhir.ContactPoint> = [
    {
      system: "phone",
      value: "tel:01",
      use: "work"
    }
  ]
  const roleTelecomExpected: Array<hl7V3.Telecom> = [
    {
      _attributes: {
        use: hl7V3.TelecomUse.WORKPLACE,
        value: "tel:01512631737"
      }
    }
  ]
  const practitionerTelecomExpected: Array<hl7V3.Telecom> = [
    {
      _attributes: {
        use: hl7V3.TelecomUse.WORKPLACE,
        value: "tel:01"
      }
    }
  ]

  test("if practitionerRole has telecom then we return that", () => {
    const output = practitioner.getAgentPersonTelecom(roleTelecom, practitionerTelecom)
    expect(output).toEqual(roleTelecomExpected)
  })
  test("if practitionerRole has no telecom and practitioner has telecom then we return that", () => {
    const output = practitioner.getAgentPersonTelecom(undefined, practitionerTelecom)
    expect(output).toEqual(practitionerTelecomExpected)
  })
  test("if neither practitionerRole or practitioner has telecom then we return undefined", () => {
    const output = practitioner.getAgentPersonTelecom(undefined, undefined)
    expect(output).toEqual(undefined)
  })
})

describe("getAgentPersonPersonId", () => {
  const sdsUserId: fhir.Identifier = {
    system: "https://fhir.nhs.uk/Id/sds-user-id",
    value: "555086689106"
  }
  const gphcCode: fhir.Identifier = {
    system: "https://fhir.hl7.org.uk/Id/gphc-number",
    value: "2083469"
  }

  test("if no sds-user-id is specified for a practitioner then throw", () => {
    expect(() => practitioner.getAgentPersonPersonId([])).toThrow()
  })
  test("if sds-user-id is present, then return it", () => {
    expect(practitioner.getAgentPersonPersonId([sdsUserId])._attributes.extension).toBe("555086689106")
  })

  test("if sds-user-id is specified alongside a professional code", () => {
    expect(practitioner.getAgentPersonPersonId([sdsUserId, gphcCode])._attributes.extension).toBe("555086689106")
  })
})

describe("convertAuthor", () => {
  let bundle: fhir.Bundle
  let fhirFirstMedicationRequest: fhir.MedicationRequest

  beforeEach(() => {
    bundle = helpers.clone(TestResources.specification[0].fhirMessageSigned)
    fhirFirstMedicationRequest = common.getMedicationRequests(bundle)[0]
  })

  describe("for a cancellation", () => {
    beforeEach(() => {
      getMessageHeader(bundle).eventCoding.code = fhir.EventCodingCode.CANCELLATION
    })

    test("doesn't include a time or signatureText field", () => {
      const result = practitioner.convertAuthor(bundle, fhirFirstMedicationRequest)
      expect(Object.keys(result)).not.toContain("time")
      expect(Object.keys(result)).not.toContain("signatureText")
    })
  })
})

describe("convertResponsibleParty", () => {
  let bundle: fhir.Bundle
  let fhirFirstMedicationRequest: fhir.MedicationRequest
  const responsiblePartyExtension = {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ResponsiblePractitioner",
    valueReference: {
      reference: "urn:uuid:7202dc57-9ac4-4666-a1c4-068a940c7a33"
    }
  }

  const responsiblePartyPR = {
    fullUrl: "urn:uuid:7202dc57-9ac4-4666-a1c4-068a940c7a33",
    resource: {
      resourceType: "PractitionerRole",
      id: "56166769-c1c4-4d07-afa8-132b5dfca666",
      identifier: [
        {
          system: "https://fhir.nhs.uk/Id/sds-role-profile-id",
          value: "212304192555"
        }
      ],
      practitioner: {
        reference: "urn:uuid:16fdc6d9-414a-487d-8939-ddc432066c3b"
      },
      organization: {
        reference: "urn:uuid:3b4b03a5-52ba-4ba6-9b82-70350aa109d8"
      },
      code: [
        {
          coding: [
            {
              system: "https://fhir.nhs.uk/CodeSystem/NHSDigital-SDS-JobRoleCode",
              code: "S8006:G8006:R8006",
              display: "Admin - Medical Secretary Access Role"
            }
          ]
        }
      ],
      telecom: [
        {
          system: "phone",
          value: "01234567890",
          use: "work"
        }
      ]
    }
  }

  const responsiblePartyPractitioner = {
    fullUrl: "urn:uuid:16fdc6d9-414a-487d-8939-ddc432066c3b",
    resource: {
      resourceType: "Practitioner",
      id: "a8c85454-f8cb-498d-9629-78e2cb5fa47a",
      identifier: [
        {
          system: "https://fhir.nhs.uk/Id/sds-user-id",
          value: "555086718101"
        },
        {
          system: "https://fhir.hl7.org.uk/Id/professional-code",
          value: "unknown"
        }
      ],
      name: [
        {
          family: "Secretary",
          given: ["Medical"],
          prefix: ["MS"]
        }
      ]
    }
  }

  beforeEach(() => {
    bundle = helpers.clone(TestResources.specification[0].fhirMessageSigned)
    fhirFirstMedicationRequest = common.getMedicationRequests(bundle)[0]
  })

  describe("for a cancellation", () => {
    beforeEach(() => {
      getMessageHeader(bundle).eventCoding.code = fhir.EventCodingCode.CANCELLATION
    })

    test("if extension is not present, responsibleParty is converted correctly", () => {
      const practitionerRole = common.getPractitionerRoles(bundle)
      const result = practitioner.convertResponsibleParty(bundle, fhirFirstMedicationRequest)
      expect(result.AgentPerson.id._attributes.extension).toBe(practitionerRole[0].identifier[0].value)

      const organizations = common.getOrganizations(bundle)
      expect(result.AgentPerson.representedOrganization.id._attributes.extension).toBe(
        organizations[0].identifier[0].value
      )
    })

    test("if responsibleParty extension is present, responsibleParty is converted correctly", () => {
      bundle.entry.push(responsiblePartyPR, responsiblePartyPractitioner)
      fhirFirstMedicationRequest.extension.push(responsiblePartyExtension)

      const result = practitioner.convertResponsibleParty(bundle, fhirFirstMedicationRequest)
      expect(result.AgentPerson.id._attributes.extension).toBe(responsiblePartyPR.resource.identifier[0].value)

      const organizations = common.getOrganizations(bundle)
      expect(result.AgentPerson.representedOrganization.id._attributes.extension).toBe(
        organizations[0].identifier[0].value
      )
    })
  })
})