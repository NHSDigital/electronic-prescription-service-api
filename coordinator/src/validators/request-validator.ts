import {Bundle, Resource} from "../services/fhir-resources"

// Validate Status

export function getStatusCode(validation: Array<ValidationError>): number {
    return validation.length > 0 ? 400 : 200
}

export function verifyPrescriptionBundle(bundle: unknown): Array<ValidationError>{
    if(verifyResourceTypeIsBundle(bundle)) {
        if(verifyBundleContainsEntries(bundle)){
            return validate(
                bundle,
                verifyHasId,
                () => verifyBundleContainsAtLeast(bundle, 1, "MedicationRequest"),
                () => verifyBundleContainsExactly(bundle, 1, "Patient"),
                () => verifyBundleContainsAtLeast(bundle, 1, "PractitionerRole"),
                () => verifyBundleContainsAtLeast(bundle, 1, "Practitioner"),
                () => verifyBundleContainsExactly(bundle, 1, "Encounter"),
                () => verifyBundleContainsExactly(bundle, 2, "Organization")
            )
        }
        return [{message: "string",
            operationOutcomeCode: "string",
            apiErrorCode: "string",
            severity: "fatal"}]
    }
    return [{message: "string",
        operationOutcomeCode: "string",
        apiErrorCode: "string",
        severity: "fatal"}]
}
// TODO tidy
export function verifyPrescriptionAndSignatureBundle(bundle: unknown): Array<ValidationError> {
    const toReturn = verifyPrescriptionBundle(bundle)

    if (toReturn.length === 1 && toReturn[0].severity === "fatal") {return toReturn}

    toReturn.push(verifyBundleContainsExactly(bundle as Bundle, 1, "Provenance"))
    return toReturn.filter(x => x)
}

// Validate
function validate(bundle: Bundle, ...validators: Array<(arg1: unknown) => ValidationError>) {
    return validators.map(v => v(bundle))
        .filter(x => x)
}

function verifyHasId(bundle: Bundle) {
    return bundle.id !== undefined ? null :{message: "ResourceType Bundle must contain 'id' field", operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD", severity: "error"}
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

function verifyBundleContainsAtLeast(bundle: Bundle, number: number, resourceType: string) {
    const matchingEntries = getMatchingEntries(bundle, resourceType)
    if (matchingEntries.length < number) {
        return {
            message: `Bundle must contain at least ${number} resource(s) of type ${resourceType}`,
            operationOutcomeCode: "value",
            apiErrorCode: "MISSING_FIELD",
            severity: "error"}
    }
    return null
}

function verifyBundleContainsExactly(bundle: Bundle, number: number, resourceType: string) {
    const matchingEntries = getMatchingEntries(bundle, resourceType)
    if (matchingEntries.length !== number) {
        return {
            message: `Bundle must contain exactly ${number} resource(s) of type ${resourceType}`,
            operationOutcomeCode: "value",
            apiErrorCode: "MISSING_FIELD",
            severity: "error"}
    }
    return null
}

export interface ValidationError{
    message: string,
    operationOutcomeCode: string,
    apiErrorCode: string,
    severity: string
}
