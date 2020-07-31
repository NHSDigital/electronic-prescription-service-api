import {clone} from "../../resources/test-helpers";
import * as TestResources from "../../resources/test-resources";
import {getResourcesOfType} from "../../../src/services/translation/common";
import {Organization} from "../../../src/model/fhir-resources";
import {convertOrganization} from "../../../src/services/translation/organization";
import {onlyElement} from "../../../src/services/translation/common";

test('convertOrganization maps identifier from fhir organization to AgentPerson.representedOrganization', () => {
    const bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    const fhirOrganizations = getResourcesOfType(bundle, new Organization())
    const firstFhirOrgnization = fhirOrganizations[0]
    firstFhirOrgnization.identifier = [{ system: "https://fhir.nhs.uk/Id/ods-organization-code", value: "identifier" }]
    const fhirIdentifier = firstFhirOrgnization.identifier.reduce(onlyElement).value
    const hl7v3AgentPersonRepresentedOrganization = convertOrganization(bundle, firstFhirOrgnization)
    const hl7v3Id = hl7v3AgentPersonRepresentedOrganization.id._attributes.extension
    expect(hl7v3Id).toEqual(fhirIdentifier)
})

test('convertOrganization maps name from fhir organization to AgentPerson.representedOrganization', () => {
    const bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    const fhirOrganizations = getResourcesOfType(bundle, new Organization())
    const firstFhirOrgnization = fhirOrganizations[0]
    firstFhirOrgnization.name = "name"
    const fhirName = firstFhirOrgnization.name
    const hl7v3AgentPersonRepresentedOrganization = convertOrganization(bundle, firstFhirOrgnization)
    const hl7v3Name = hl7v3AgentPersonRepresentedOrganization.name._text
    expect(hl7v3Name).toEqual(fhirName)
})

test('convertOrganization maps telecom from fhir organization to AgentPerson.representedOrganization when present', () => {
    const bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    const fhirOrganizations = getResourcesOfType(bundle, new Organization())
    const firstFhirOrgnization = fhirOrganizations[0]
    firstFhirOrgnization.telecom = [{ use: "work", value: "tel:01234567890" }]
    const fhirTelecom = firstFhirOrgnization.telecom.reduce(onlyElement).value
    const hl7v3AgentPersonRepresentedOrganization = convertOrganization(bundle, firstFhirOrgnization)
    const hl7v3Telecom = hl7v3AgentPersonRepresentedOrganization.telecom._attributes.value
    expect(hl7v3Telecom).toEqual(fhirTelecom)
})

test('convertOrganization maps address from fhir organization to AgentPerson.representedOrganization when present', () => {
    const bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    const fhirOrganizations = getResourcesOfType(bundle, new Organization())
    const firstFhirOrgnization = fhirOrganizations[0]
    firstFhirOrgnization.address = [{ use: "work", line: ["53 Address"], postalCode: "P0STC0D3" }]
    const fhirAddress = firstFhirOrgnization.address.reduce(onlyElement)
    const hl7v3AgentPersonRepresentedOrganization = convertOrganization(bundle, firstFhirOrgnization)
    const hl7v3Address = hl7v3AgentPersonRepresentedOrganization.addr
    expect(hl7v3Address.streetAddressLine[0]._text).toEqual(fhirAddress.line[0])
    expect(hl7v3Address.postalCode._text).toEqual(fhirAddress.postalCode)
})

test('convertOrganization does not throw when minimum required fields are provided', () => {
    const bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    const fhirOrganizations = getResourcesOfType(bundle, new Organization())
    const firstFhirOrgnization = fhirOrganizations[0]
    firstFhirOrgnization.address = undefined
    firstFhirOrgnization.partOf = undefined
    firstFhirOrgnization.telecom = undefined
    convertOrganization(bundle, firstFhirOrgnization)
})
