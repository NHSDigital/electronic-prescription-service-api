import * as validator from "../../src/validators/request-validator"
import {Resource} from "../../src/services/fhir-resources";

test('rejects null', () => {
    expect(() => validator.verifyPrescriptionBundle(null))
        .toThrow("ResourceType must be 'Bundle' on request")
})

test('rejects undefined', () => {
    expect(() => validator.verifyPrescriptionBundle(undefined))
        .toThrow("ResourceType must be 'Bundle' on request")
})

test('rejects object which is not a resource', () => {
    expect(() => validator.verifyPrescriptionBundle({}))
        .toThrow("ResourceType must be 'Bundle' on request")
})

test('rejects resource which is not a bundle', () => {
    const patient = {
        resourceType: "Patient"
    }
    expect(() => validator.verifyPrescriptionBundle(patient))
        .toThrow("ResourceType must be 'Bundle' on request")
})

test('rejects bundle without entries', () => {
    const bundle = {
        resourceType: "Bundle"
    }
    expect(() => validator.verifyPrescriptionBundle(bundle))
        .toThrow("ResourceType Bundle must contain 'entry' field")
})

test('rejects bundle without id', () => {
    const bundle = {
        resourceType: "Bundle",
        entry: [] as Array<Resource>
    }
    expect(() => validator.verifyPrescriptionBundle(bundle))
        .toThrow("ResourceType Bundle must contain 'id' field")
})

test('rejects bundle without MedicationRequest', () => {
    const bundle = {
        resourceType: "Bundle",
        id: "test-bundle",
        entry: [] as Array<Resource>
    }
    expect(() => validator.verifyPrescriptionBundle(bundle))
        .toThrow("Bundle must contain at least 1 resource(s) of type MedicationRequest")
})

test('rejects bundle without Patient', () => {
    const bundle = {
        resourceType: "Bundle",
        id: "test-bundle",
        entry: [
            {
                resource: {
                    resourceType: "MedicationRequest"
                }
            }
        ]
    }
    expect(() => validator.verifyPrescriptionBundle(bundle))
        .toThrow("Bundle must contain exactly 1 resource(s) of type Patient")
})

test('rejects bundle with two Patients', () => {
    const bundle = {
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
    expect(() => validator.verifyPrescriptionBundle(bundle))
        .toThrow("Bundle must contain exactly 1 resource(s) of type Patient")
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
    expect(() => validator.verifyPrescriptionBundle(validBundleWithoutSignature))
        .not.toThrow()
})

test('verifyPrescriptionAndSignatureBundle rejects bundle without Provenance', () => {
    expect(() => validator.verifyPrescriptionAndSignatureBundle(validBundleWithoutSignature))
        .toThrow()
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
    expect(() => validator.verifyPrescriptionAndSignatureBundle(validBundleWithSignature))
        .not.toThrow()
})
