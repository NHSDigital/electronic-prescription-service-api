import Boom from "boom"
import * as fhir from "../services/fhir-resources"

function verifyMessageIsResource(message: unknown): message is fhir.Resource {
    return (message as fhir.Resource)?.resourceType !== undefined
}

function verifyResourceTypeIsBundle(resource: unknown): resource is fhir.Bundle {
    return verifyMessageIsResource(resource)
        && resource.resourceType === "Bundle"
}

function verifyBundleContainsEntries(bundle: fhir.Bundle) {
    return bundle.entry !== undefined
}

function getMatchingEntries(bundle: fhir.Bundle, resourceType: string) {
    return bundle.entry
        .map(entry => entry.resource)
        .filter(resource => resource.resourceType === resourceType)
}

function verifyHasId(bundle: fhir.Bundle) {
    return bundle.id !== undefined
}

function verifyBundleContainsAtLeast(bundle: fhir.Bundle, number: number, resourceType: string) {
    const matchingEntries = getMatchingEntries(bundle, resourceType)
    if (matchingEntries.length < number) {
        throw Boom.badRequest(
            "Bundle must contain at least " + number + " resource(s) of type " + resourceType,
            {operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD"}
        )
    }
}

function verifyBundleContainsExactly(bundle: fhir.Bundle, number: number, resourceType: string) {
    const matchingEntries = getMatchingEntries(bundle, resourceType)
    if (matchingEntries.length !== number) {
        throw Boom.badRequest(
            "Bundle must contain exactly " + number + " resource(s) of type " + resourceType,
            {operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD"}
        )
    }
}

export function verifyPrescriptionBundle(bundle: unknown): void {
    if (!verifyResourceTypeIsBundle(bundle)) {
        throw Boom.badRequest(
            "ResourceType must be 'Bundle' on request",
            {operationOutcomeCode: "value", apiErrorCode: "INCORRECT_RESOURCETYPE"}
        )
    }

    if (!verifyBundleContainsEntries(bundle)) {
        throw Boom.badRequest(
            "ResourceType Bundle must contain 'entry' field",
            {operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD"}
        )
    }

    if (!verifyHasId(bundle)) {
        throw Boom.badRequest(
            "ResourceType Bundle must contain 'id' field",
            {operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD"}
        )
    }

    verifyBundleContainsAtLeast(bundle, 1, "MedicationRequest")
    verifyBundleContainsExactly(bundle, 1, "Patient")
    verifyBundleContainsAtLeast(bundle, 1, "PractitionerRole")
    verifyBundleContainsAtLeast(bundle, 1, "Practitioner")
    verifyBundleContainsExactly(bundle, 1, "Encounter")
    verifyBundleContainsExactly(bundle, 2, "Organization")
}

export function verifyPrescriptionAndSignatureBundle(bundle: fhir.Bundle): void {
    verifyPrescriptionBundle(bundle)
    verifyBundleContainsExactly(bundle, 1, "Provenance")
}
