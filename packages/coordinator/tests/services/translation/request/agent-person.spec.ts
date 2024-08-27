import {fhir, hl7V3} from "@models"
import {
  convertOrganization,
  createAgentPersonPersonUsingPractitionerRole,
  createAgentPersonUsingPractitionerRoleAndOrganization,
  createAuthorForWithdraw
} from "../../../../src/services/translation/request/agent-person"
import * as testData from "../../../resources/test-data"
import {OrganisationTypeCode} from "../../../../src/services/translation/common/organizationTypeCode"

const mockConvertTelecom = jest.fn()
const mockConvertAddress = jest.fn()

jest.mock("../../../../src/services/translation/request/demographics", () => ({
  convertTelecom: (contactPoint: fhir.ContactPoint, fhirPath: string) =>
    mockConvertTelecom(contactPoint, fhirPath),
  convertAddress: (fhirAddress: fhir.Address, fhirPath: string) =>
    mockConvertAddress(fhirAddress, fhirPath)
}))

describe("createAgentPersonUsingPractitionerRoleAndOrganization", () => {
  const mockTelecomResponse = new hl7V3.Telecom()
  mockConvertTelecom.mockReturnValue(mockTelecomResponse)
  test("Creates AgentPerson using practitioner role and organization", () => {
    const result = createAgentPersonUsingPractitionerRoleAndOrganization(
      testData.practitionerRole,
      testData.organization
    )

    expect(result.id).toStrictEqual(new hl7V3.SdsRoleProfileIdentifier("555086415105"))
    expect(result.code).toStrictEqual(new hl7V3.SdsJobRoleCode("R8000"))
    expect(result.telecom).toStrictEqual([mockTelecomResponse])
  })
})

describe("createAgentPersonPersonUsingPractitionerRole", () => {
  test("Creates AgentPersonPerson using practitioner role", () => {
    const result = createAgentPersonPersonUsingPractitionerRole(testData.practitionerRole)

    expect(result.id).toStrictEqual(new hl7V3.ProfessionalCode("3415870201"))
    expect(result.name._text).toStrictEqual(testData.practitionerRole.practitioner.display)
  })
})

describe("convertOrganization", () => {
  const mockTelecomResponse = new hl7V3.Telecom()
  mockConvertTelecom.mockReturnValue(mockTelecomResponse)
  const mockAddressResponse = new hl7V3.Address()
  mockConvertAddress.mockReturnValue(mockAddressResponse)
  test("Converts organization correctly", () => {
    const result = convertOrganization(testData.organization, testData.telecom)

    expect(result.id).toStrictEqual(new hl7V3.SdsOrganizationIdentifier("VNE51"))
    expect(result.code).toStrictEqual(new hl7V3.OrganizationTypeCode(OrganisationTypeCode.NOT_SPECIFIED))
    expect(result.name).toStrictEqual(new hl7V3.Text(testData.organization.name))

    expect(mockConvertAddress).toBeCalledWith(testData.organization.address[0], "Organization.address")
    expect(mockConvertTelecom).toBeCalledWith(testData.organization.telecom[0], "Organization.telecom")
  })

  test("Uses passed in telecom if organization doesn't have one", () => {
    const testOrganization: fhir.Organization = {
      ...testData.organization,
      telecom: null
    }
    convertOrganization(testOrganization, testData.telecom)

    expect(mockConvertTelecom).toBeCalledWith(testData.telecom, "Organization.telecom")
  })

  test("Converts organization correctly if organization is missing address", () => {
    const testOrganization: fhir.Organization = {
      ...testData.organization,
      address: null
    }
    const result = convertOrganization(testOrganization, testData.telecom)

    expect(result.addr).toBeUndefined()
  })
})

describe("createAuthorForWithdraw", () => {
  test("Creates an AuthorPersonSDS with correct values.", () => {
    const result = createAuthorForWithdraw(testData.practitionerRole, testData.organization)

    expect(result).toBeInstanceOf(hl7V3.AuthorPersonSds)

    expect(result.AgentPersonSDS.id).toStrictEqual(new hl7V3.SdsRoleProfileIdentifier("555086415105"))

    expect(result.AgentPersonSDS.agentPersonSDS.id).toStrictEqual(new hl7V3.SdsUniqueIdentifier("VNE51"))
  })
})
