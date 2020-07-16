import {Bundle, MedicationRequest, Resource} from "../services/fhir-resources"

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

    const bundleValidators = [
        verifyHasId,
        (bundle: Bundle) => verifyBundleContainsAtLeast(bundle, 1, "MedicationRequest"),
        (bundle: Bundle) => verifyBundleContainsExactly(bundle, 1, "Patient"),
        (bundle: Bundle) => verifyBundleContainsAtLeast(bundle, 1, "PractitionerRole"),
        (bundle: Bundle) => verifyBundleContainsAtLeast(bundle, 1, "Practitioner"),
        (bundle: Bundle) => verifyBundleContainsAtLeast(bundle, 2, "Organization")
    ]
    if (requireSignature) {
        bundleValidators.push((bundle: Bundle) => verifyBundleContainsExactly(bundle, 1, "Provenance"))
    }
    const bundleValidationErrors = validate(bundle, ...bundleValidators)

    const medicationRequestConsistencyValidators = [
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, (medicationRequest) => medicationRequest.groupIdentifier),
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, (medicationRequest) => medicationRequest.category),
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, (medicationRequest) => medicationRequest.authoredOn),
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, (medicationRequest) => medicationRequest.courseOfTherapyType),
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, (medicationRequest) => medicationRequest.subject),
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, (medicationRequest) => medicationRequest.requester),
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, (medicationRequest) => medicationRequest.dispenseRequest.performer)
    ]
    const medicationRequests = getMatchingEntries(bundle, "MedicationRequest") as Array<MedicationRequest>
    const medicationRequestConsistencyValidationErrors = validate(medicationRequests, ...medicationRequestConsistencyValidators)

    return [
        ...bundleValidationErrors,
        ...medicationRequestConsistencyValidationErrors
    ]
}

type Validator<T> = (input: T) => ValidationError

// Validate
function validate<T>(input: T, ...validators: Array<Validator<T>>) {
    return validators.map(v => v(input))
        .filter(x => x)
}

function verifyValueIdenticalForAllMedicationRequests<U>(
    medicationRequests: Array<MedicationRequest>,
    accessor: (resource: MedicationRequest) => U
): ValidationError {
    const fieldValues = medicationRequests.map(accessor)
    const serializedFieldValues = fieldValues.map(value => JSON.stringify(value))
    const uniqueFieldValues = new Set(serializedFieldValues).size
    return uniqueFieldValues > 1 ? {
        message: `Expected all MedicationRequests to have the same value for ${accessor}`,
        operationOutcomeCode: "value",
        apiErrorCode: "TODO",
        severity: "error"
    } : null
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
