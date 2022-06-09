import {fhir, hl7V3} from "@models"
import {
  convertOrganization,
  createAgentPersonPersonUsingPractitionerRole,
  createAgentPersonUsingPractitionerRoleAndOrganization
} from "../../../../src/services/translation/request/agent-unattended"
import {practitionerRole, organization, mockTelecom} from "./dispense/release.spec"
import {OrganisationTypeCode} from "../../../../src/services/translation/common/organizationTypeCode"

const mockConvertTelecom = jest.fn()
const mockConvertAddress = jest.fn()
const mockAgentPersonPersonId = jest.fn()

jest.mock("../../../../src/services/translation/request/demographics", () => ({
  convertTelecom: (contactPoint: fhir.ContactPoint, fhirPath: string) =>
    mockConvertTelecom(contactPoint, fhirPath),
  convertAddress: (fhirAddress: fhir.Address, fhirPath: string) =>
    mockConvertAddress(fhirAddress, fhirPath)
}))

jest.mock("../../../../src/services/translation/request/practitioner", () => ({
  getAgentPersonPersonIdForAuthor: (
    fhirPractitionerIdentifier: Array<fhir.Identifier>,
    fhirPractitionerRoleIdentifier: Array<fhir.Identifier>
  ) => mockAgentPersonPersonId(fhirPractitionerIdentifier, fhirPractitionerRoleIdentifier)
}))

describe("createAgentPersonUsingPractitionerRoleAndOrganization", () => {
  const mockTelecomResponse = new hl7V3.Telecom
  mockConvertTelecom.mockReturnValue(mockTelecomResponse)
  test("Creates AgentPerson using practitioner role and organization", () => {
    const result = createAgentPersonUsingPractitionerRoleAndOrganization(practitionerRole, organization)
    console.log(result)
    expect(result.id).toStrictEqual(new hl7V3.SdsRoleProfileIdentifier("555086415105"))
    expect(result.code).toStrictEqual(new hl7V3.SdsJobRoleCode("R8000"))
    expect(result.telecom).toStrictEqual([mockTelecomResponse])
  })
})

describe("createAgentPersonPersonUsingPractitionerRole", () => {
  const mockAgentPersonPersonIdResponse = new hl7V3.ProfessionalCode("abcd")
  mockAgentPersonPersonId.mockReturnValue(mockAgentPersonPersonIdResponse)
  test("Creates AgentPersonPerson using practitioner role", () => {
    const result = createAgentPersonPersonUsingPractitionerRole(practitionerRole)
    console.log(result)
    expect(result.id).toStrictEqual(mockAgentPersonPersonIdResponse)
    expect(result.name._text).toStrictEqual(practitionerRole.practitioner.display)
  })
})

describe("convertOrganization", () => {
  const mockTelecomResponse = new hl7V3.Telecom
  mockConvertTelecom.mockReturnValue(mockTelecomResponse)
  const mockAddressResponse = new hl7V3.Address
  mockConvertAddress.mockReturnValue(mockAddressResponse)
  test("Converts organization correctly", () => {
    const result = convertOrganization(organization, mockTelecom)
    console.log(result)
    expect(result.id).toStrictEqual(new hl7V3.SdsOrganizationIdentifier("VNE51"))
    expect(result.code).toStrictEqual(new hl7V3.OrganizationTypeCode(OrganisationTypeCode.NOT_SPECIFIED))
    expect(result.name).toStrictEqual(new hl7V3.Text(organization.name))
    expect(result.telecom).toStrictEqual(mockTelecomResponse)
    expect(result.addr).toStrictEqual(mockAddressResponse)
  })
})

