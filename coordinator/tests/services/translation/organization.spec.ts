import {clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import {Bundle, HealthcareService, Location, Organization} from "../../../src/model/fhir-resources"
import {
  getHealthcareServices,
  getOrganizations
} from "../../../src/services/translation/common/getResourcesOfType"
import {convertOrganizationAndProviderLicense} from "../../../src/services/translation/organization"
import {getResourceForFullUrl} from "../../../src/services/translation/common"

describe("convertOrganizationAndProviderLicense", () => {
  let bundle: Bundle
  let firstFhirOrganization: Organization
  let firstFhirHealthcareService: HealthcareService

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    firstFhirOrganization = getOrganizations(bundle)[0]
    firstFhirHealthcareService = getHealthcareServices(bundle)[0]
  })

  test("maps identifier from fhir organization to AgentPerson.representedOrganization", () => {
    const expectedValue = "identifier"
    firstFhirOrganization.identifier = [{system: "https://fhir.nhs.uk/Id/ods-organization-code", value: expectedValue}]

    const hl7v3AgentPersonRepresentedOrganization = convertOrganizationAndProviderLicense(bundle, firstFhirOrganization, firstFhirHealthcareService)
    const attributes = hl7v3AgentPersonRepresentedOrganization.id._attributes

    expect(attributes.root).toEqual("1.2.826.0.1285.0.1.10")
    expect(attributes.extension).toEqual(expectedValue)
  })

  test("maps name from fhir organization to AgentPerson.representedOrganization", () => {
    const expectedName = "name"
    firstFhirOrganization.name = expectedName

    const hl7v3AgentPersonRepresentedOrganization = convertOrganizationAndProviderLicense(bundle, firstFhirOrganization, firstFhirHealthcareService)

    expect(hl7v3AgentPersonRepresentedOrganization.name._text).toEqual(expectedName)
  })

  test("maps telecom from fhir organization to AgentPerson.representedOrganization when present", () => {
    const expectedTelecomValue = "tel:01234567890"
    firstFhirOrganization.telecom = [{use: "work", value: expectedTelecomValue}]

    const hl7v3AgentPersonRepresentedOrganization = convertOrganizationAndProviderLicense(bundle, firstFhirOrganization, firstFhirHealthcareService)
    const attributes = hl7v3AgentPersonRepresentedOrganization.telecom._attributes

    expect(attributes.use).toEqual("WP")
    expect(attributes.value).toEqual(expectedTelecomValue)
  })

  test("maps address from fhir organization to AgentPerson.representedOrganization when present", () => {
    const expectedAddressLine = "53 Address"
    const expectedPostalCode = "P0STC0D3"
    firstFhirOrganization.address = [{use: "work", line: [expectedAddressLine], postalCode: expectedPostalCode}]

    const hl7v3AgentPersonRepresentedOrganization = convertOrganizationAndProviderLicense(bundle, firstFhirOrganization, firstFhirHealthcareService)
    const hl7v3Address = hl7v3AgentPersonRepresentedOrganization.addr

    expect(hl7v3Address._attributes.use).toEqual("WP")
    expect(hl7v3Address.streetAddressLine[0]._text).toEqual(expectedAddressLine)
    expect(hl7v3Address.postalCode._text).toEqual(expectedPostalCode)
  })

  test("does not throw when minimum required fields are provided", () => {
    firstFhirOrganization.address = undefined
    firstFhirOrganization.partOf = undefined
    firstFhirOrganization.telecom = undefined

    expect(() => convertOrganizationAndProviderLicense(bundle, firstFhirOrganization, firstFhirHealthcareService)).not.toThrow()
  })
})

describe("Homecare Prescription Organization Conversion", () => {
  let bundle: Bundle
  let firstFhirOrganization: Organization
  let firstFhirHealthcareService: HealthcareService

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription3.fhirMessageUnsigned)
    firstFhirOrganization = getOrganizations(bundle)[0]
    firstFhirHealthcareService = getHealthcareServices(bundle)[0]
  })

  test("if Organization has code value RO197, should have 999 in representedOrganization code", () => {
    const result = convertOrganizationAndProviderLicense(bundle, firstFhirOrganization, firstFhirHealthcareService)
    expect(result.code._attributes.code).toBe("999")
  })

  test("If HealthcareProviderLicense Organization doesn't have a type code, should put 008 in type code", () => {
    const result = convertOrganizationAndProviderLicense(bundle, firstFhirOrganization, firstFhirHealthcareService)
    expect(result.healthCareProviderLicense.Organization.code._attributes.code).toBe("008")
  })

  test("Doesn't convert address or telephone number in HealthcareProvider Licence", () => {
    const result = convertOrganizationAndProviderLicense(bundle, firstFhirOrganization, firstFhirHealthcareService)
    expect(result.healthCareProviderLicense.Organization.addr).toBe(undefined)
    expect(result.healthCareProviderLicense.Organization.telecom).toBe(undefined)
  })

  test("If Location in HomecarePrescription bundle, it's address is the responsibleOrganization address", () => {
    const locationRef = getHealthcareServices(bundle)[0].location[0].reference
    const locationAddress = (getResourceForFullUrl(bundle, locationRef) as Location).address
    const resultAddress = convertOrganizationAndProviderLicense(bundle, firstFhirOrganization, firstFhirHealthcareService).addr
    locationAddress.line.forEach(line => expect(resultAddress.streetAddressLine.map(line => line._text)).toContain(line))
    expect(resultAddress.streetAddressLine.map(line => line._text)).toContain(locationAddress.city)
    expect(resultAddress.postalCode._text).toBe(locationAddress.postalCode)
  })
})
