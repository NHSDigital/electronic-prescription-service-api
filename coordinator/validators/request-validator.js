const Boom = require('boom')

function verifyResourceTypeIsBundle(bundle) {
  return bundle && bundle["resourceType"] && bundle["resourceType"] === "Bundle"
}

function verifyBundleContainsEntries(bundle) {
  return bundle && bundle["entry"]
}

function getMatchingEntries(bundle, resourceType) {
  return bundle["entry"]
    .map(entry => entry.resource)
    .filter(resource => resource["resourceType"] === resourceType)
}

function verifyHasId(bundle) {
  return bundle && bundle["id"]
}

function verifyBundleContainsAtLeast(bundle, number, resourceType) {
  const matchingEntries = getMatchingEntries(bundle, resourceType)
  if (matchingEntries.length < number) {
    throw Boom.badRequest(
      "Bundle must contain at least " + number + " resource(s) of type " + resourceType,
      {operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD"}
    )
  }
}

function verifyBundleContainsExactly(bundle, number, resourceType) {
  const matchingEntries = getMatchingEntries(bundle, resourceType)
  if (matchingEntries.length !== number) {
    throw Boom.badRequest(
      "Bundle must contain exactly " + number + " resource(s) of type " + resourceType,
      {operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD"}
    )
  }
}

function verifyPrescriptionBundle(bundle) {
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

function verifyPrescriptionAndSignatureBundle(bundle) {
  verifyPrescriptionBundle(bundle)
  verifyBundleContainsExactly(bundle, 1, "Provenance")
}

module.exports = {
  verifyPrescriptionBundle,
  verifyPrescriptionAndSignatureBundle
}
