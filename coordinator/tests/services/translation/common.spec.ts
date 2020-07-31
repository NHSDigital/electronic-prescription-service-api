import {
    getIdentifierValueForSystem, getIdentifierValueOrNullForSystem,
    getResourceForFullUrl,
    getResourcesOfType
} from "../../../src/services/translation/common";
import * as TestResources from "../../resources/test-resources";
import * as fhir from "../../../src/model/fhir-resources";
import {Identifier, MedicationRequest} from "../../../src/model/fhir-resources";
import {clone} from "../../resources/test-helpers";

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

describe('getIdentifierValueForSystem', () => {
    const identifierArray: Array<Identifier> = [
        {
            "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
            "value": "100112897984"
        },
        {
            "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
            "value": "A7B86F8D-1D81-FC28-E050-D20AE3A215F0"
        },
        {
            "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
            "value": "A7B86F8D-1D81-FC28-E050-D20AE3A215F0"
        }
    ]

    test('getIdentifierValueForSystem throws error for no value of system', () => {
        expect(() => getIdentifierValueForSystem(identifierArray, "bob")).toThrow()
    })

    test('getIdentifierValueForSystem returns correct value for system', () => {
        const result = getIdentifierValueForSystem(identifierArray, "https://fhir.nhs.uk/Id/sds-role-profile-id")
        expect(result).toBe("100112897984")
    })

    test('getIdentifierValueForSystem throws error when finding multiple values for system', () => {
        expect(() => getIdentifierValueForSystem(identifierArray, "https://fhir.nhs.uk/Id/prescription-order-item-number")).toThrow()
    })
})

describe('getIdentifierValueOrNullForSystem', () => {
    const identifierArray: Array<Identifier> = [
        {
            "system": "https://fhir.nhs.uk/Id/sds-role-profile-id",
            "value": "100112897984"
        },
        {
            "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
            "value": "A7B86F8D-1D81-FC28-E050-D20AE3A215F0"
        },
        {
            "system": "https://fhir.nhs.uk/Id/prescription-order-item-number",
            "value": "A7B86F8D-1D81-FC28-E050-D20AE3A215F0"
        }
    ]

    test('getIdentifierValueForSystem throws error for no value of system', () => {
        const result = getIdentifierValueOrNullForSystem(identifierArray, "bob")
        expect(result).toBe(undefined)
    })

    test('getIdentifierValueForSystem returns correct value for system', () => {
        const result = getIdentifierValueOrNullForSystem(identifierArray, "https://fhir.nhs.uk/Id/sds-role-profile-id")
        expect(result).toBe("100112897984")
    })

    test('getIdentifierValueForSystem throws error when finding multiple values for system', () => {
        expect(() => getIdentifierValueOrNullForSystem(identifierArray, "https://fhir.nhs.uk/Id/prescription-order-item-number")).toThrow()
    })
})
