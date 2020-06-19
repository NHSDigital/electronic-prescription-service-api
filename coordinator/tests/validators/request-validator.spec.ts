import * as validator from "../../src/validators/request-validator"
import {Resource} from "../../src/services/fhir-resources";

const resourceNotABundleError = [{message: "ResourceType must be 'Bundle' on request",
    operationOutcomeCode: "value",
    apiErrorCode: "INCORRECT_RESOURCETYPE",
    severity: "fatal"}]

function containAtLeastError(resource: string) {
    return {message: `Bundle must contain at least 1 resource(s) of type ${resource}`,
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
    expect(validator.verifyPrescriptionBundle(null))
        .toEqual(resourceNotABundleError)
})

test('verifyPrescriptionBundle rejects undefined', () => {
    expect(validator.verifyPrescriptionBundle(undefined))
        .toEqual(resourceNotABundleError)
})

test('verifyPrescriptionBundle rejects object which is not a resource', () => {
    expect(validator.verifyPrescriptionBundle({}))
        .toEqual(resourceNotABundleError)
})

test('verifyPrescriptionBundle rejects resource which is not a bundle', () => {
    const patient = {
        resourceType: "Patient"
    }
    expect(validator.verifyPrescriptionBundle(patient))
        .toEqual(resourceNotABundleError)
})

test('verifyPrescriptionBundle rejects bundle without entries', () => {
    const bundle = {
        resourceType: "Bundle"
    }
    expect(validator.verifyPrescriptionBundle(bundle))
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
    expect(validator.verifyPrescriptionBundle(bundle))
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
    expect(validator.verifyPrescriptionBundle(bundle))
        .toContainEqual(containAtLeastError("MedicationRequest"))
})

test('verifyPrescriptionBundle rejects bundle without Patient', () => {
    const bundle = {
        resourceType: "Bundle",
        id: "test-bundle",
        entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle))
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
    expect(validator.verifyPrescriptionBundle(bundle))
        .toContainEqual(containExactlyError("Patient", 1))
})

test('verifyPrescriptionBundle rejects bundle without PractitionerRole', () => {
    const bundle = {
        resourceType: "Bundle",
        id: "test-bundle",
        entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle))
        .toContainEqual(containAtLeastError("PractitionerRole"))
})

test('verifyPrescriptionBundle rejects bundle without Practitioner', () => {
    const bundle = {
        resourceType: "Bundle",
        id: "test-bundle",
        entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle))
        .toContainEqual(containAtLeastError("Practitioner"))
})

test('verifyPrescriptionBundle rejects bundle without Encounter', () => {
    const bundle = {
        resourceType: "Bundle",
        id: "test-bundle",
        entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle))
        .toContainEqual(containExactlyError("Encounter", 1))
})

test('verifyPrescriptionBundle rejects bundle without Organization', () => {
    const bundle = {
        resourceType: "Bundle",
        id: "test-bundle",
        entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionBundle(bundle))
        .toContainEqual(containExactlyError("Organization", 2))
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
    expect(validator.verifyPrescriptionBundle(bundle))
        .toContainEqual(containExactlyError("Organization", 2))
})

test('verifyPrescriptionAndSignatureBundle rejects bundle without Provenance', () => {
    const bundle = {
        resourceType: "Bundle",
        entry: [] as Array<Resource>
    }
    expect(validator.verifyPrescriptionAndSignatureBundle(bundle))
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
                resourceType: "Encounter"
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
    expect(validator.verifyPrescriptionBundle(validBundleWithoutSignature))
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
                resourceType: "Encounter"
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

test('verifyPrescriptionAndSignatureBundle accepts bundle with required Resources', () => {
    expect(validator.verifyPrescriptionAndSignatureBundle(validBundleWithSignature))
        .toEqual([])
})
