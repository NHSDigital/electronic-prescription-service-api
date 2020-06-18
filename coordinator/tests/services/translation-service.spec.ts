import * as translationService from "../../src/services/translation-service"
import {
    convertBundleToParentPrescription,
    convertFhirMessageToHl7V3SignedInfo,
    convertParentPrescriptionToSignatureFragments, writeXmlStringCanonicalized
} from "../../src/services/translation-service"
import * as fhir from "../../src/services/fhir-resources";
import * as TestResources from "../resources/test-resources"
import * as XmlJs from "xml-js";
import {MedicationRequest} from "../../src/services/fhir-resources";

function clone<T>(input: T) {
    return JSON.parse(JSON.stringify(input))
}

test('getResourcesOfType returns correct resources', () => {
    const result = translationService.getResourcesOfType(TestResources.fhirPrescriptionMessage1, "MedicationRequest")
    expect(result).toBeInstanceOf(Array)
    expect(result).toHaveLength(4)
    result.map(x => expect((x as fhir.Resource).resourceType).toBe("MedicationRequest"))
})

test('getResourceForFullUrl returns correct resources', () => {
    const result = translationService.getResourceForFullUrl(TestResources.fhirPrescriptionMessage1, "urn:uuid:A7B86F8D-1D81-FC28-E050-D20AE3A215F0")
    expect((result as fhir.Resource).resourceType).toBe("MedicationRequest")
})

test('getResourceForFullUrl throws error when finding multiple resources', () => {
    const bundle2 = clone(TestResources.fhirPrescriptionMessage1)
    bundle2.entry[1].fullUrl = bundle2.entry[0].fullUrl
    expect(() => translationService.getResourceForFullUrl(bundle2, bundle2.entry[0].fullUrl)).toThrow(TypeError)
})

test('getIdentifierValueForSystem returns correct value for system', () => {
    const medicationRequest = translationService.getResourceForFullUrl(TestResources.fhirPrescriptionMessage1, "urn:uuid:A7B86F8D-1D81-FC28-E050-D20AE3A215F0") as MedicationRequest
    const result = translationService.getIdentifierValueForSystem(medicationRequest.groupIdentifier, "urn:uuid")
    expect(result).toBe("A7B86F8D-1D02-FC28-E050-D20AE3A215F0")
})

test('getIdentifierValueForSystem throws error when finding multiple values for system', () => {
    const medicationRequest = translationService.getResourceForFullUrl(TestResources.fhirPrescriptionMessage1, "urn:uuid:A7B86F8D-1D81-FC28-E050-D20AE3A215F0") as MedicationRequest
    const groupIdentifier = clone(medicationRequest.groupIdentifier)
    groupIdentifier[1].system = groupIdentifier[0].system
    expect(() => translationService.getIdentifierValueForSystem(groupIdentifier, groupIdentifier[0].system)).toThrow()
})

test("convertBundleToParentPrescription returns correct value", () => {
    const options = {compact: true, spaces: 4, attributesFn: translationService.sortAttributes} as unknown as XmlJs.Options.JS2XML

    const actualRoot = {
        ParentPrescription: convertBundleToParentPrescription(TestResources.fhirPrescriptionMessage1)
    }
    const actualXmlStr = XmlJs.js2xml(actualRoot, options)

    const expectedRoot = {
        ParentPrescription: TestResources.hl7V3ParentPrescription1
    }
    const expectedXmlStr = XmlJs.js2xml(expectedRoot, options)

    expect(actualXmlStr).toEqual(expectedXmlStr)
})

test("convertParentPrescriptionToSignatureFragments returns correct value", () => {
    const options = {compact: true, spaces: 4, attributesFn: translationService.sortAttributes} as unknown as XmlJs.Options.JS2XML

    const actualRoot = convertParentPrescriptionToSignatureFragments(TestResources.hl7V3ParentPrescription1)
    const actualXmlStr = XmlJs.js2xml(actualRoot, options)

    const expectedXmlStr = XmlJs.js2xml(TestResources.hl7V3ParentPrescriptionFragments1, options)

    expect(actualXmlStr).toEqual(expectedXmlStr)
})

test("writeXmlStringCanonicalized returns correct value", () => {
    const actualOutput = writeXmlStringCanonicalized(TestResources.hl7V3ParentPrescriptionFragments1)
    //Remove the newline added at the end of the file by the IDE
    const expectedOutput = TestResources.hl7V3ParentPrescriptionFragmentsCanonicalized1.replace("\n", "")
    expect(actualOutput).toEqual(expectedOutput)
})

test("convertFhirMessageToHl7V3SignedInfo returns correct value", () => {
    const actualOutput = convertFhirMessageToHl7V3SignedInfo(TestResources.fhirPrescriptionMessage1)
    //Remove the newline added at the end of the file by the IDE
    const expectedOutput = TestResources.hl7V3SignedInfoCanonicalized1.replace("\n", "")
    expect(actualOutput).toEqual(expectedOutput)
})
