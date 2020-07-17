import * as translationService from "../../src/services/translation-service"
import * as translator from "../../src/services/translation-service"
import {
    convertBundleToParentPrescription,
    convertFhirMessageToHl7V3SignedInfo,
    convertParentPrescriptionToSignatureFragments,
    writeXmlStringCanonicalized
} from "../../src/services/translation-service"
import * as fhir from "../../src/services/fhir-resources"
import * as TestResources from "../resources/test-resources"
import * as XmlJs from "xml-js"

jest.mock('uuid', () => {
    return {
        v4: () => {
            return "A7B86F8D-1DBD-FC28-E050-D20AE3A215F0"
        }
    }
})

test('getResourcesOfType returns correct resources', () => {
    const result = translationService.getResourcesOfType(TestResources.examplePrescription1.fhirMessageUnsigned, "MedicationRequest")
    expect(result).toBeInstanceOf(Array)
    expect(result).toHaveLength(4)
    result.map(x => expect((x as fhir.Resource).resourceType).toBe("MedicationRequest"))
})

test('getResourceForFullUrl returns correct resources', () => {
    const result = translationService.getResourceForFullUrl(TestResources.examplePrescription1.fhirMessageUnsigned, "urn:uuid:A7B86F8D-1D81-FC28-E050-D20AE3A215F0")
    expect((result as fhir.Resource).resourceType).toBe("MedicationRequest")
})

test('getResourceForFullUrl throws error when finding multiple resources', () => {
    const bundle2 = TestResources.clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    bundle2.entry[1].fullUrl = bundle2.entry[0].fullUrl
    expect(() => translationService.getResourceForFullUrl(bundle2, bundle2.entry[0].fullUrl)).toThrow(TypeError)
})

test('convertCourseOfTherapyType returns "0001" prescription treatment type code when first therapy type code is "acute"', () => {
    const bundle2 = TestResources.clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    const fhirMedicationRequests = translationService.getResourcesOfType(bundle2, "MedicationRequest") as Array<fhir.MedicationRequest>
    const firstFhirMedicationRequest = fhirMedicationRequests[0]
    firstFhirMedicationRequest.courseOfTherapyType.coding[0].code = "acute"
    const prescriptionTreatmentType = translationService.convertCourseOfTherapyType(firstFhirMedicationRequest)
    expect(prescriptionTreatmentType.value._attributes.code).toEqual("0001")
})

test('convertCourseOfTherapyType returns "0002" prescription treatment type code when first therapy type code is "repeat"', () => {
    const bundle2 = TestResources.clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    const fhirMedicationRequests = translationService.getResourcesOfType(bundle2, "MedicationRequest") as Array<fhir.MedicationRequest>
    const firstFhirMedicationRequest = fhirMedicationRequests[0]
    firstFhirMedicationRequest.courseOfTherapyType.coding[0].code = "repeat"
    const prescriptionTreatmentType = translationService.convertCourseOfTherapyType(firstFhirMedicationRequest)
    expect(prescriptionTreatmentType.value._attributes.code).toEqual("0002")
})

test('convertCourseOfTherapyType returns "0003" prescription treatment type code when first therapy type code is "repeat-dispensing"', () => {
    const bundle2 = TestResources.clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    const fhirMedicationRequests = translationService.getResourcesOfType(bundle2, "MedicationRequest") as Array<fhir.MedicationRequest>
    const firstFhirMedicationRequest = fhirMedicationRequests[0]
    firstFhirMedicationRequest.courseOfTherapyType.coding[0].code = "repeat-dispensing"
    const prescriptionTreatmentType = translationService.convertCourseOfTherapyType(firstFhirMedicationRequest)
    expect(prescriptionTreatmentType.value._attributes.code).toEqual("0003")
})

test('getIdentifierValueForSystem returns correct value for system', () => {
    const practitioner = translationService.getResourceForFullUrl(TestResources.examplePrescription1.fhirMessageUnsigned, "urn:uuid:D4B569E7-CCF6-4BB2-029B-34B6F3E82ACF") as fhir.Practitioner
    const result = translationService.getIdentifierValueForSystem(practitioner.identifier, "https://fhir.nhs.uk/Id/sds-role-profile-id")
    expect(result).toBe("100112897984")
})

test('getIdentifierValueForSystem throws error when finding multiple values for system', () => {
    const practitioner = translationService.getResourceForFullUrl(TestResources.examplePrescription1.fhirMessageUnsigned, "urn:uuid:D4B569E7-CCF6-4BB2-029B-34B6F3E82ACF") as fhir.Practitioner
    const identifier = TestResources.clone(practitioner.identifier)
    identifier[0].system = identifier[1].system
    expect(() => translationService.getIdentifierValueForSystem(identifier, identifier[1].system)).toThrow()
})

test(
    "convertBundleToParentPrescription returns correct value",
    xmlTest(
        convertBundleToParentPrescription(TestResources.examplePrescription1.fhirMessageSigned),
        TestResources.examplePrescription1.hl7V3ParentPrescription
    )
)

test(
    "convertParentPrescriptionToSignatureFragments returns correct value",
    xmlTest(
        convertParentPrescriptionToSignatureFragments(TestResources.examplePrescription1.hl7V3ParentPrescription),
        TestResources.examplePrescription1.hl7V3SignatureFragments
    )
)

test("writeXmlStringCanonicalized returns correct value", () => {
    const actualOutput = writeXmlStringCanonicalized(TestResources.examplePrescription1.hl7V3SignatureFragments)
    const expectedOutput = TestResources.examplePrescription1.hl7V3FragmentsCanonicalized
    expect(actualOutput).toEqual(expectedOutput)
})

test("convertFhirMessageToHl7V3SignedInfo returns correct value", () => {
    const actualOutput = convertFhirMessageToHl7V3SignedInfo(TestResources.examplePrescription1.fhirMessageUnsigned)
    const expectedOutput = JSON.stringify(TestResources.examplePrescription1.fhirMessageDigest, null, 2)
    expect(actualOutput).toEqual(expectedOutput)
})

test(
    "convertBundleToParentPrescription returns correct value with nominated pharmacy",
    xmlTest(
        convertBundleToParentPrescription(TestResources.examplePrescription2.fhirMessageSigned),
        TestResources.examplePrescription2.hl7V3ParentPrescription
    )
)

test(
    "convertFhirMessageToHl7V3ParentPrescription returns correct value",
    xmlTest(
        XmlJs.xml2js(translator.convertFhirMessageToHl7V3ParentPrescription(TestResources.examplePrescription1.fhirMessageSigned), {compact: true}),
        TestResources.examplePrescription1.hl7V3Message
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
