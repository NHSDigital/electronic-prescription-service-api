import * as validator from "../../src/validators/request-validator"
import {Resource} from "../../src/services/fhir-resources";

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

const validBundleWithoutSignature = {
    resourceType: "Bundle",
    id: "test-bundle",
    entry: [
        {
            resource: {
                resourceType: "MedicationRequest"
            }
        },
        {
            resource: {
                resourceType: "MedicationRequest"
            }
        },
        {
            resource: {
                resourceType: "Patient"
            }
        },
        {
            resource: {
                resourceType: "PractitionerRole"
            }
        },
        {
            resource: {
                resourceType: "Practitioner"
            }
        },
        {
            resource: {
                resourceType: "Organization"
            }
        },
        {
            resource: {
                resourceType: "Organization"
            }
        }
    ]
}

test('verifyPrescriptionBundle accepts bundle with required Resources', () => {
    expect(validator.verifyPrescriptionBundle(validBundleWithoutSignature, false))
        .toEqual([])
})

const validBundleWithSignature = {
    resourceType: "Bundle",
    id: "test-bundle",
    entry: [
        {
            resource: {
                resourceType: "MedicationRequest"
            }
        },
        {
            resource: {
                resourceType: "MedicationRequest"
            }
        },
        {
            resource: {
                resourceType: "Patient"
            }
        },
        {
            resource: {
                resourceType: "PractitionerRole"
            }
        },
        {
            resource: {
                resourceType: "Practitioner"
            }
        },
        {
            resource: {
                resourceType: "Organization"
            }
        },
        {
            resource: {
                resourceType: "Organization"
            }
        },
        {
            resource: {
                resourceType: "Provenance"
            }
        }
    ]
}

test('verifyPrescriptionBundle accepts bundle with required Resources when requireSignature is true', () => {
    expect(validator.verifyPrescriptionBundle(validBundleWithSignature, true))
        .toEqual([])
})
