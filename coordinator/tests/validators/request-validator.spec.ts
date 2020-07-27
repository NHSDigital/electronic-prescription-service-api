import * as validator from "../../src/validators/request-validator"
import {MedicationRequest, Resource} from "../../src/model/fhir-resources";
import * as TestResources from "../resources/test-resources"

const resourceNotABundleError = [{message: "ResourceType must be 'Bundle' on request",
    operationOutcomeCode: "value",
    apiErrorCode: "INCORRECT_RESOURCETYPE",
    severity: "fatal"}]

function containAtLeastError(resource: string, numberOfResources: number) {
    return {message: `Bundle must contain at least ${numberOfResources} resource(s) of type ${resource}`,
        operationOutcomeCode: "value",
        apiErrorCode: "MISSING_FIELD",
        severity: "error"}
}

function containExactlyError(resource: string, numberOfResources: number) {
    return {message: `Bundle must contain exactly ${numberOfResources} resource(s) of type ${resource}`,
        operationOutcomeCode: "value",
        apiErrorCode: "MISSING_FIELD",
        severity: "error"}
}

test('verifyPrescriptionBundle rejects null', () => {
    expect(validator.verifyPrescriptionBundle(null, false))
        .toEqual(resourceNotABundleError)
})

test('verifyPrescriptionBundle rejects undefined', () => {
    expect(validator.verifyPrescriptionBundle(undefined, false))
        .toEqual(resourceNotABundleError)
})

test('verifyPrescriptionBundle rejects object which is not a resource', () => {
    expect(validator.verifyPrescriptionBundle({}, false))
        .toEqual(resourceNotABundleError)
})

test('verifyPrescriptionBundle rejects resource which is not a bundle', () => {
    const patient = {
        resourceType: "Patient"
    }
    expect(validator.verifyPrescriptionBundle(patient, false))
        .toEqual(resourceNotABundleError)
})

test('verifyPrescriptionBundle rejects bundle without entries', () => {
    const bundle = {
        resourceType: "Bundle"
    }
    expect(validator.verifyPrescriptionBundle(bundle, false))
        .toEqual([{message: "ResourceType Bundle must contain 'entry' field",
            operationOutcomeCode: "value",
            apiErrorCode: "MISSING_FIELD",
            severity: "fatal"}])
})

test('verifyPrescriptionBundle rejects bundle without id', () => {
    const bundle = {
        resourceType: "Bundle",
        entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle, false))
        .toContainEqual({message: "ResourceType Bundle must contain 'id' field",
            operationOutcomeCode: "value",
            apiErrorCode: "MISSING_FIELD",
            severity: "error"})
})

test('verifyPrescriptionBundle rejects bundle without MedicationRequest', () => {
    const bundle = {
        resourceType: "Bundle",
        id: "test-bundle",
        entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle, false))
        .toContainEqual(containAtLeastError("MedicationRequest", 1))
})

test('verifyPrescriptionBundle rejects bundle without Patient', () => {
    const bundle = {
        resourceType: "Bundle",
        id: "test-bundle",
        entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle, false))
        .toContainEqual(containExactlyError("Patient", 1))
})

test('verifyPrescriptionBundle rejects bundle with two Patients', () => {
    const bundle = {
        resourceType: "Bundle",
        id: "test-bundle",
        entry: [
            {
                resource: {
                    resourceType: "Patient"
                }
            },
            {
                resource: {
                    resourceType: "Patient"
                }
            }
        ]
    }
    expect(validator.verifyPrescriptionBundle(bundle, false))
        .toContainEqual(containExactlyError("Patient", 1))
})

test('verifyPrescriptionBundle rejects bundle without PractitionerRole', () => {
    const bundle = {
        resourceType: "Bundle",
        id: "test-bundle",
        entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle, false))
        .toContainEqual(containAtLeastError("PractitionerRole", 1))
})

test('verifyPrescriptionBundle rejects bundle without Practitioner', () => {
    const bundle = {
        resourceType: "Bundle",
        id: "test-bundle",
        entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle, false))
        .toContainEqual(containAtLeastError("Practitioner", 1))
})

test('verifyPrescriptionBundle rejects bundle without Organization', () => {
    const bundle = {
        resourceType: "Bundle",
        id: "test-bundle",
        entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle, false))
        .toContainEqual(containAtLeastError("Organization", 2))
})

test('verifyPrescriptionBundle rejects bundle with 1 Organization', () => {
    const bundle = {
        resourceType: "Bundle",
        id: "test-bundle",
        entry: [
            {
                resource: {
                    resourceType: "Organization"
                }
            }]
    }
    expect(validator.verifyPrescriptionBundle(bundle, false))
        .toContainEqual(containAtLeastError("Organization", 2))
})

test('verifyPrescriptionBundle rejects bundle without Provenance when requireSignature is true', () => {
    const bundle = {
        resourceType: "Bundle",
        entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle, true))
        .toContainEqual(containExactlyError("Provenance", 1))
})

const validBundleWithoutSignature = TestResources.examplePrescription1.fhirMessageUnsigned

test('verifyPrescriptionBundle accepts bundle with required Resources', () => {
    expect(validator.verifyPrescriptionBundle(validBundleWithoutSignature, false))
        .toEqual([])
})

const validBundleWithSignature = TestResources.examplePrescription1.fhirMessageSigned

test('verifyPrescriptionBundle accepts bundle with required Resources when requireSignature is true', () => {
    expect(validator.verifyPrescriptionBundle(validBundleWithSignature, true))
        .toEqual([])
})

test("Should accept message where fields common to all MedicationRequests are identical", () => {
    expect(validator.verifyPrescriptionBundle(TestResources.examplePrescription1.fhirMessageUnsigned, false))
        .toEqual([])
})

test("Should reject message where MedicationRequests have different authoredOn", () => {
    const bundle = TestResources.clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    const medicationRequests = validator.getMatchingEntries(bundle, "MedicationRequest") as Array<MedicationRequest>
    medicationRequests.forEach(medicationRequest => medicationRequest.authoredOn = "2020-01-02T00:00:00.000Z")
    medicationRequests[0].authoredOn = "2020-01-01T00:00:00.000Z"
    expect(validator.verifyPrescriptionBundle(bundle, false)).toEqual([{
        "apiErrorCode": "INVALID_VALUE",
        "message": "Expected all MedicationRequests to have the same value for authoredOn. Received \"2020-01-01T00:00:00.000Z\",\"2020-01-02T00:00:00.000Z\".",
        "operationOutcomeCode": "value",
        "severity": "error",
    }])
})

test("Should reject message where MedicationRequests have different dispenseRequest.performer", () => {
    const bundle = TestResources.clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    const medicationRequests = validator.getMatchingEntries(bundle, "MedicationRequest") as Array<MedicationRequest>
    medicationRequests.forEach(medicationRequest => medicationRequest.dispenseRequest.performer = {reference: "pharmacy1"})
    medicationRequests[3].dispenseRequest.performer = {reference: "pharmacy2"}
    expect(validator.verifyPrescriptionBundle(bundle, false)).toEqual([{
        "apiErrorCode": "INVALID_VALUE",
        "message": "Expected all MedicationRequests to have the same value for dispenseRequest.performer. Received {\"reference\":\"pharmacy1\"},{\"reference\":\"pharmacy2\"}.",
        "operationOutcomeCode": "value",
        "severity": "error",
    }])
})

test("Null should contribute to the count of unique values", () => {
    const bundle = TestResources.clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    const medicationRequests = validator.getMatchingEntries(bundle, "MedicationRequest") as Array<MedicationRequest>
    medicationRequests[0].groupIdentifier = null
    const validationErrors = validator.verifyPrescriptionBundle(bundle, false)
    expect(validationErrors).toHaveLength(1)
    expect(validationErrors[0].apiErrorCode).toEqual("INVALID_VALUE")
})

test("Undefined should contribute to the count of unique values", () => {
    const bundle = TestResources.clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    const medicationRequests = validator.getMatchingEntries(bundle, "MedicationRequest") as Array<MedicationRequest>
    medicationRequests[0].groupIdentifier = undefined
    const validationErrors = validator.verifyPrescriptionBundle(bundle, false)
    expect(validationErrors).toHaveLength(1)
    expect(validationErrors[0].apiErrorCode).toEqual("INVALID_VALUE")
})
