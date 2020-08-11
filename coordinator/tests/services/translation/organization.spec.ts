import {clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import {Bundle, Organization} from "../../../src/model/fhir-resources"
import {getResourcesOfType} from "../../../src/services/translation/common"
import {convertOrganization} from "../../../src/services/translation/organization"

describe("convertOrganization", ()=> {
  let bundle: Bundle
  let firstFhirOrganization: Organization

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    firstFhirOrganization = getResourcesOfType(bundle, new Organization())[0]
  })

  test("maps identifier from fhir organization to AgentPerson.representedOrganization", () => {
    const expectedValue = "identifier"
    firstFhirOrganization.identifier = [{system: "https://fhir.nhs.uk/Id/ods-organization-code", value: expectedValue}]

    const hl7v3AgentPersonRepresentedOrganization = convertOrganization(bundle, firstFhirOrganization)
    const attributes = hl7v3AgentPersonRepresentedOrganization.id._attributes

    expect(attributes.root).toEqual("1.2.826.0.1285.0.1.10")
    expect(attributes.extension).toEqual(expectedValue)
  })

  test("maps name from fhir organization to AgentPerson.representedOrganization", () => {
    const expectedName = "name"
    firstFhirOrganization.name = expectedName

    const hl7v3AgentPersonRepresentedOrganization = convertOrganization(bundle, firstFhirOrganization)

    expect(hl7v3AgentPersonRepresentedOrganization.name._text).toEqual(expectedName)
  })

  test("maps telecom from fhir organization to AgentPerson.representedOrganization when present", () => {
    const expectedTelecomValue = "tel:01234567890"
    firstFhirOrganization.telecom = [{use: "work", value: expectedTelecomValue}]

    const hl7v3AgentPersonRepresentedOrganization = convertOrganization(bundle, firstFhirOrganization)
    const attributes = hl7v3AgentPersonRepresentedOrganization.telecom._attributes

    expect(attributes.use).toEqual("WP")
    expect(attributes.value).toEqual(expectedTelecomValue)
  })

  test("maps address from fhir organization to AgentPerson.representedOrganization when present", () => {
    const expectedAddressLine = "53 Address"
    const expectedPostalCode = "P0STC0D3"
    firstFhirOrganization.address = [{use: "work", line: [expectedAddressLine], postalCode: expectedPostalCode}]

    const hl7v3AgentPersonRepresentedOrganization = convertOrganization(bundle, firstFhirOrganization)
    const hl7v3Address = hl7v3AgentPersonRepresentedOrganization.addr

    expect(hl7v3Address._attributes.use).toEqual("WP")
    expect(hl7v3Address.streetAddressLine[0]._text).toEqual(expectedAddressLine)
    expect(hl7v3Address.postalCode._text).toEqual(expectedPostalCode)
  })

  test("does not throw when minimum required fields are provided", () => {
    firstFhirOrganization.address = undefined
    firstFhirOrganization.partOf = undefined
    firstFhirOrganization.telecom = undefined

    expect(() => convertOrganization(bundle, firstFhirOrganization)).not.toThrow()
  })
})
