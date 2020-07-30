import {
    getIdentifierValueForSystem,
    getResourceForFullUrl,
    getResourcesOfType, wrapInOperationOutcome
} from "../../../src/services/translation/common";
import * as TestResources from "../../resources/test-resources";
import * as fhir from "../../../src/model/fhir-resources";
import {MedicationRequest} from "../../../src/model/fhir-resources";
import {clone} from "../../resources/test-helpers";
import * as spine from "../../../src/services/spine-communication"

test('getResourcesOfType returns correct resources', () => {
    const result = getResourcesOfType(TestResources.examplePrescription1.fhirMessageUnsigned, new MedicationRequest())
    expect(result).toBeInstanceOf(Array)
    expect(result).toHaveLength(4)
    result.map(x => expect((x as fhir.Resource).resourceType).toBe("MedicationRequest"))
})

test('getResourceForFullUrl returns correct resources', () => {
    const result = getResourceForFullUrl(TestResources.examplePrescription1.fhirMessageUnsigned, "urn:uuid:A7B86F8D-1D81-FC28-E050-D20AE3A215F0")
    expect((result as fhir.Resource).resourceType).toBe("MedicationRequest")
})

test('getResourceForFullUrl throws error when finding multiple resources', () => {
    const bundle2 = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    bundle2.entry[1].fullUrl = bundle2.entry[0].fullUrl
    expect(() => getResourceForFullUrl(bundle2, bundle2.entry[0].fullUrl)).toThrow(TypeError)
})

test('getIdentifierValueForSystem returns correct value for system', () => {
    const practitioner = getResourceForFullUrl(TestResources.examplePrescription1.fhirMessageUnsigned, "urn:uuid:D4B569E7-CCF6-4BB2-029B-34B6F3E82ACF") as fhir.Practitioner
    const result = getIdentifierValueForSystem(practitioner.identifier, "https://fhir.nhs.uk/Id/sds-role-profile-id")
    expect(result).toBe("100112897984")
})

test('getIdentifierValueForSystem throws error when finding multiple values for system', () => {
    const practitioner = getResourceForFullUrl(TestResources.examplePrescription1.fhirMessageUnsigned, "urn:uuid:D4B569E7-CCF6-4BB2-029B-34B6F3E82ACF") as fhir.Practitioner
    const identifier = clone(practitioner.identifier)
    identifier[0].system = identifier[1].system
    expect(() => getIdentifierValueForSystem(identifier, identifier[1].system)).toThrow()
})

describe('wrapInOperationOutcome', () => {
    test('returns informational OperationOutcome for status code <= 299', () => {
        const spineResponse: spine.SpineResponse = {statusCode: 299, body: "test"}
        const result = wrapInOperationOutcome(spineResponse)
        expect(result.issue[0].severity).toEqual("information")
        expect(result.issue[0].code).toEqual("informational")
    })

    test('returns error OperationOutcome for status code > 299', () => {
        const spineResponse: spine.SpineResponse = {statusCode: 300, body: "test"}
        const result = wrapInOperationOutcome(spineResponse)
        expect(result.issue[0].severity).toEqual("error")
        expect(result.issue[0].code).toEqual("invalid")
    })
})

