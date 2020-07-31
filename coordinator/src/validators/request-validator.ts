import {Bundle, MedicationRequest, Resource} from "../model/fhir-resources"
import {getExtensionForUrl} from "../services/translation/common"

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
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, "groupIdentifier", (medicationRequest) => medicationRequest.groupIdentifier),
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, "category", (medicationRequest) => medicationRequest.category),
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, "authoredOn", (medicationRequest) => medicationRequest.authoredOn),
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, "courseOfTherapyType", (medicationRequest) => medicationRequest.courseOfTherapyType),
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, "subject", (medicationRequest) => medicationRequest.subject),
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, "requester", (medicationRequest) => medicationRequest.requester),
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, "dispenseRequest.performer", (medicationRequest) => medicationRequest.dispenseRequest.performer),
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, "dispenseRequest.extension (performer site type)", (medicationRequest) => getExtensionForUrl(medicationRequest.dispenseRequest.extension, "https://fhir.nhs.uk/R4/StructureDefinition/Extension-performerSiteType")),
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, "extension (prescription type)", (medicationRequest) => getExtensionForUrl(medicationRequest.extension, "https://fhir.nhs.uk/R4/StructureDefinition/Extension-prescriptionType")),
        (medicationRequests: Array<MedicationRequest>) => verifyValueIdenticalForAllMedicationRequests(medicationRequests, "extension (responsible practitioner)", (medicationRequest) => getExtensionForUrl(medicationRequest.extension, "https://fhir.nhs.uk/R4/StructureDefinition/Extension-DM-ResponsiblePractitioner"))
    ]
    const medicationRequests = getMatchingEntries(bundle, "MedicationRequest") as Array<MedicationRequest>
    const medicationRequestConsistencyValidationErrors = validate(medicationRequests, ...medicationRequestConsistencyValidators)

    return [
        ...bundleValidationErrors,
        ...medicationRequestConsistencyValidationErrors
    ]
}

function notEmpty<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined
}
type Validator<T> = (input: T) => ValidationError | null

// Validate
function validate<T>(input: T, ...validators: Array<Validator<T>>): Array<ValidationError> {
    return validators.map(v => v(input))
        .filter(notEmpty)
}

function verifyValueIdenticalForAllMedicationRequests<U>(
    medicationRequests: Array<MedicationRequest>,
    fieldName: string,
    fieldAccessor: (resource: MedicationRequest) => U
): ValidationError | null {
    const fieldValues = medicationRequests.map(fieldAccessor)
    const serializedFieldValues = fieldValues.map(value => JSON.stringify(value))
    const uniqueFieldValues = new Set(serializedFieldValues)
    return uniqueFieldValues.size === 1 ? null : {
        message: `Expected all MedicationRequests to have the same value for ${fieldName}. Received ${[...uniqueFieldValues]}.`,
        operationOutcomeCode: "value",
        apiErrorCode: "INVALID_VALUE",
        severity: "error"
    }
}

function verifyHasId(bundle: Bundle): ValidationError | null {
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

export function getMatchingEntries(bundle: Bundle, resourceType: string): Array<Resource> {
    return bundle.entry
        .map(entry => entry.resource)
        .filter(notEmpty)
        .filter(resource => resource.resourceType === resourceType)
}

function verifyBundleContainsAtLeast(bundle: Bundle, number: number, resourceType: string): ValidationError | null {
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

function verifyBundleContainsExactly(bundle: Bundle, number: number, resourceType: string): ValidationError | null {
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
