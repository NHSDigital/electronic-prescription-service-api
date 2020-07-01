import * as translationService from "../../src/services/translation-service"
import {
    convertBundleToParentPrescription,
    convertFhirMessageToHl7V3SignedInfo,
    convertParentPrescriptionToSignatureFragments,
    writeXmlStringCanonicalized
} from "../../src/services/translation-service"
import * as fhir from "../../src/services/fhir-resources"
import * as TestResources from "../resources/test-resources"
import * as XmlJs from "xml-js"
import {wrap} from "../../src/resources/transport-wrapper";

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
    const practitioner = translationService.getResourceForFullUrl(TestResources.fhirPrescriptionMessage1, "urn:uuid:d4b569e7-ccf6-4bb2-029b-34b6f3e82acf") as fhir.Practitioner
    const result = translationService.getIdentifierValueForSystem(practitioner.identifier, "https://fhir.nhs.uk/Id/sds-role-profile-id")
    expect(result).toBe("100112897984")
})

test('getIdentifierValueForSystem throws error when finding multiple values for system', () => {
    const practitioner = translationService.getResourceForFullUrl(TestResources.fhirPrescriptionMessage1, "urn:uuid:d4b569e7-ccf6-4bb2-029b-34b6f3e82acf") as fhir.Practitioner
    const identifier = clone(practitioner.identifier)
    identifier[0].system = identifier[1].system
    expect(() => translationService.getIdentifierValueForSystem(identifier, identifier[1].system)).toThrow()
})

test(
    "convertBundleToParentPrescription returns correct value",
    xmlTest(
        convertBundleToParentPrescription(TestResources.fhirPrescriptionMessage1),
        TestResources.hl7V3ParentPrescription1
    )
)

test(
    "convertParentPrescriptionToSignatureFragments returns correct value",
    xmlTest(
        convertParentPrescriptionToSignatureFragments(TestResources.hl7V3ParentPrescription1),
        TestResources.hl7V3ParentPrescriptionFragments1
    )
)

test("writeXmlStringCanonicalized returns correct value", () => {
    const actualOutput = writeXmlStringCanonicalized(TestResources.hl7V3ParentPrescriptionFragments1)
    //Remove the newline added at the end of the file by the IDE
    const expectedOutput = TestResources.hl7V3ParentPrescriptionFragmentsCanonicalized1.replace("\n", "")
    expect(actualOutput).toEqual(expectedOutput)
})

test("convertFhirMessageToHl7V3SignedInfo returns correct value", () => {
    const actualOutput = convertFhirMessageToHl7V3SignedInfo(TestResources.fhirPrescriptionMessage1)
    //Remove the newline added at the end of the file by the IDE
    const expectedOutput = TestResources.hl7V3SignedInfoCanonicalized1
    expect(actualOutput).toEqual(expectedOutput)
})

test(
    "convertBundleToParentPrescription returns correct value with nominated pharmacy",
    xmlTest(
        convertBundleToParentPrescription(TestResources.fhirPrescriptionMessage2),
        TestResources.hl7V3ParentPrescription2
    )
)

test(
    "convertFhirMessageToHl7V3ParentPrescription returns correct value with wrapper",
    xmlTest(
        wrap(convertBundleToParentPrescription(TestResources.fhirPrescriptionMessage1)),
        TestResources.hl7V3ParentPrescriptionMessage1
    )
)

function xmlTest(actualRoot: XmlJs.ElementCompact, expectedRoot: XmlJs.ElementCompact) {
    return () => {
        const options = {
            compact: true,
            spaces: 4,
            attributesFn: translationService.sortAttributes
        } as unknown as XmlJs.Options.JS2XML
        const actualXmlStr = XmlJs.js2xml(actualRoot, options)
        const expectedXmlStr = XmlJs.js2xml(expectedRoot, options)
        expect(actualXmlStr).toEqual(expectedXmlStr)
    }
}
