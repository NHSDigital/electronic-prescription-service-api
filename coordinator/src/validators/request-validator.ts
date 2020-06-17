import {Bundle, Resource} from "../services/fhir-resources"
import * as Boom from "@hapi/boom"

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

function verifyHasId(bundle: Bundle) {
    return bundle.id !== undefined
}

function verifyBundleContainsAtLeast(bundle: Bundle, number: number, resourceType: string) {
    const matchingEntries = getMatchingEntries(bundle, resourceType)
    if (matchingEntries.length < number) {
        throw Boom.badRequest(
            `Bundle must contain at least ${number} resource(s) of type ${resourceType}`,
            {operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD"}
        )
    }
}

function verifyBundleContainsExactly(bundle: Bundle, number: number, resourceType: string) {
    const matchingEntries = getMatchingEntries(bundle, resourceType)
    if (matchingEntries.length !== number) {
        throw Boom.badRequest(
            `Bundle must contain exactly ${number} resource(s) of type ${resourceType}`,
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

export function verifyPrescriptionAndSignatureBundle(bundle: unknown): void {
    verifyPrescriptionBundle(bundle)
    verifyBundleContainsExactly(bundle as Bundle, 1, "Provenance")
}
