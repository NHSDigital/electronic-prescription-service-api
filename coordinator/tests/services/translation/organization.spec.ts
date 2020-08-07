import {clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import {Bundle, Organization} from "../../../src/model/fhir-resources"
import {getResourcesOfType, onlyElement} from "../../../src/services/translation/common"
import {convertOrganization} from "../../../src/services/translation/organization"

describe("convertOrganization", ()=> {
  let bundle: Bundle
  let firstFhirOrganization: Organization

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    firstFhirOrganization = getResourcesOfType(bundle, new Organization())[0]
  })

  test("convertOrganization maps identifier from fhir organization to AgentPerson.representedOrganization", () => {
    firstFhirOrganization.identifier = [{system: "https://fhir.nhs.uk/Id/ods-organization-code", value: "identifier"}]
    const fhirIdentifier = firstFhirOrganization.identifier.reduce(onlyElement).value

    const hl7v3AgentPersonRepresentedOrganization = convertOrganization(bundle, firstFhirOrganization)
    const hl7v3Id = hl7v3AgentPersonRepresentedOrganization.id._attributes.extension

    expect(hl7v3Id).toEqual(fhirIdentifier)
  })

  test("convertOrganization maps name from fhir organization to AgentPerson.representedOrganization", () => {
    firstFhirOrganization.name = "name"
    const fhirName = firstFhirOrganization.name

    const hl7v3AgentPersonRepresentedOrganization = convertOrganization(bundle, firstFhirOrganization)
    const hl7v3Name = hl7v3AgentPersonRepresentedOrganization.name._text

    expect(hl7v3Name).toEqual(fhirName)
  })

  test("convertOrganization maps telecom from fhir organization to AgentPerson.representedOrganization when present", () => {
    firstFhirOrganization.telecom = [{use: "work", value: "tel:01234567890"}]
    const fhirTelecom = firstFhirOrganization.telecom.reduce(onlyElement).value

    const hl7v3AgentPersonRepresentedOrganization = convertOrganization(bundle, firstFhirOrganization)
    const hl7v3Telecom = hl7v3AgentPersonRepresentedOrganization.telecom._attributes.value

    expect(hl7v3Telecom).toEqual(fhirTelecom)
  })

  test("convertOrganization maps address from fhir organization to AgentPerson.representedOrganization when present", () => {
    firstFhirOrganization.address = [{use: "work", line: ["53 Address"], postalCode: "P0STC0D3"}]
    const fhirAddress = firstFhirOrganization.address.reduce(onlyElement)

    const hl7v3AgentPersonRepresentedOrganization = convertOrganization(bundle, firstFhirOrganization)
    const hl7v3Address = hl7v3AgentPersonRepresentedOrganization.addr

    expect(hl7v3Address.streetAddressLine[0]._text).toEqual(fhirAddress.line[0])
    expect(hl7v3Address.postalCode._text).toEqual(fhirAddress.postalCode)
  })

  test("convertOrganization does not throw when minimum required fields are provided", () => {
    firstFhirOrganization.address = undefined
    firstFhirOrganization.partOf = undefined
    firstFhirOrganization.telecom = undefined

    expect(() => convertOrganization(bundle, firstFhirOrganization)).not.toThrow()
  })
})
