import {Bundle, Resource} from "../services/fhir-resources"

// Validate Status

export function getStatusCode(validation: Array<ValidationError>): number {
    return validation.length > 0 ? 400 : 200
}

export function verifyPrescriptionBundle(bundle: unknown, requireSignature: boolean): Array<ValidationError> {
    if (!verifyResourceTypeIsBundle(bundle)) {
        return [{
            message: "ResourceType must be 'Bundle' on request",
            operationOutcomeCode: "value",
            apiErrorCode: "INCORRECT_RESOURCETYPE",
            severity: "fatal"
        }]
    }

    if (!verifyBundleContainsEntries(bundle)) {
        return [{
            message: "ResourceType Bundle must contain 'entry' field",
            operationOutcomeCode: "value",
            apiErrorCode: "MISSING_FIELD",
            severity: "fatal"
        }]
    }

    const validators = [
        verifyHasId,
        (bundle: Bundle) => verifyBundleContainsAtLeast(bundle, 1, "MedicationRequest"),
        (bundle: Bundle) => verifyBundleContainsExactly(bundle, 1, "Patient"),
        (bundle: Bundle) => verifyBundleContainsAtLeast(bundle, 1, "PractitionerRole"),
        (bundle: Bundle) => verifyBundleContainsAtLeast(bundle, 1, "Practitioner"),
        (bundle: Bundle) => verifyBundleContainsAtLeast(bundle, 2, "Organization")
    ]

    if (requireSignature) {
        validators.push((bundle: Bundle) => verifyBundleContainsExactly(bundle, 1, "Provenance"))
    }

    return validate(bundle, ...validators)
}

// Validate
function validate(bundle: Bundle, ...validators: Array<(arg1: unknown) => ValidationError>) {
    return validators.map(v => v(bundle))
        .filter(x => x)
}

function verifyHasId(bundle: Bundle): ValidationError {
    return bundle.id !== undefined ? null : {
        message: "ResourceType Bundle must contain 'id' field",
        operationOutcomeCode: "value",
        apiErrorCode: "MISSING_FIELD",
        severity: "error"
    }
}

function verifyMessageIsResource(message: unknown): message is Resource {
    return (message as Resource)?.resourceType !== undefined
}

function verifyResourceTypeIsBundle(resource: unknown): resource is Bundle {
    return verifyMessageIsResource(resource)
        && resource.resourceType === "Bundle"
}

function verifyBundleContainsEntries(bundle: Bundle) {
    return bundle.entry !== undefined
}

function getMatchingEntries(bundle: Bundle, resourceType: string) {
    return bundle.entry
        .map(entry => entry.resource)
        .filter(resource => resource.resourceType === resourceType)
}

function verifyBundleContainsAtLeast(bundle: Bundle, number: number, resourceType: string): ValidationError {
    const matchingEntries = getMatchingEntries(bundle, resourceType)
    if (matchingEntries.length < number) {
        return {
            message: `Bundle must contain at least ${number} resource(s) of type ${resourceType}`,
            operationOutcomeCode: "value",
            apiErrorCode: "MISSING_FIELD",
            severity: "error"
        }
    }
    return null
}

function verifyBundleContainsExactly(bundle: Bundle, number: number, resourceType: string): ValidationError {
    const matchingEntries = getMatchingEntries(bundle, resourceType)
    if (matchingEntries.length !== number) {
        return {
            message: `Bundle must contain exactly ${number} resource(s) of type ${resourceType}`,
            operationOutcomeCode: "value",
            apiErrorCode: "MISSING_FIELD",
            severity: "error"
        }
    }
    return null
}

export interface ValidationError {
    message: string,
    operationOutcomeCode: string,
    apiErrorCode: string,
    severity: string
}
