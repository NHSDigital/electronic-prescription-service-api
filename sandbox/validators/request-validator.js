const { Validation, Maybe, Success, Fail } = require('monet');
const examples = require('../services/examples')

// Validate Status

function getStatusCode(validation) {
  return validation.length > 0 ? 400 : 200
}

// Validation Composition

function verifyPrescriptionBundle(bundle) {
  return validate(
    bundle,
    verifyPayloadId,
    verifyResourceTypeIsBundle,
    verifyBundleContainsEntries,
    () => verifyBundleContainsAtLeast(bundle, 1, "MedicationRequest"),
    () => verifyBundleContainsExactly(bundle, 1, "Patient"),
    () => verifyBundleContainsAtLeast(bundle, 1, "Practitioner"),
    () => verifyBundleContainsExactly(bundle, 2, "Organization")
  )
}

function verifyPrescriptionAndSignatureBundle(bundle) {
  return validate(
    bundle,
    verifyPayloadId,
    verifyResourceTypeIsBundle,
    verifyBundleContainsEntries,
    () => verifyBundleContainsExactly(bundle, 1, "Provenance")
  )
}

// Validate

function validate(bundle, ...validators) {
  return Maybe.fromNull(bundle)
    .flatMap(m => validators.map(v => v(m)))
    .reverse()
    .reduce((acc, validation) => validation.ap(acc), Success().acc())
    .val
}

// Validator Functions

function verifyPayloadId(bundle) {
  var validPayloadIds = []

  for (let example in examples) {
    validPayloadIds.push(examples[example].id);
  }

  return Maybe.fromNull(bundle)
    .filterNot(bundle => validPayloadIds.includes(bundle["id"]))
    .cata(success(bundle), fail({message: "Unsupported 'id'", operationOutcomeCode: "value", apiErrorCode: "UNSUPPORTED_ID" }));
}

function verifyResourceTypeIsBundle(bundle) {
  return Maybe.fromNull(bundle)
    .filterNot(bundle => bundle["resourceType"] && bundle["resourceType"] === "Bundle")
    .cata(success(bundle), fail({message: "ResourceType must be 'Bundle' on request", operationOutcomeCode: "value", apiErrorCode: "INCORRECT_RESOURCETYPE"}));
}

function verifyBundleContainsEntries(bundle) {
  return Maybe.fromNull(bundle)
    .filterNot(bundle => bundle["entry"])
    .cata(success(bundle), fail({message: "ResourceType Bundle must contain 'entry' field", operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD"}));
}

function verifyBundleContainsAtLeast(bundle, number, resourceType) {
  return Maybe.fromNull(bundle)
    .filter(bundle => hasLessThan(bundle, number, resourceType))
    .cata(success(bundle), fail({message: `Bundle entry must contain at least ${number} resource(s) of type ${resourceType}`, operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD" }))

  function hasLessThan(bundle, number, resourceType) {
    return bundle["entry"] && bundle["entry"].map(entry => entry["resource"] || {}).filter(resource => resource.resourceType === resourceType).length < number;
  }
}

function verifyBundleContainsExactly(bundle, number, resourceType) {
  return Maybe.fromNull(bundle)
    .filterNot(bundle => hasExactly(bundle, number, resourceType))
    .cata(success(bundle), fail({message: `Bundle entry must contain exactly ${number} resource(s) of type ${resourceType}`, operationOutcomeCode: "value", apiErrorCode: "MISSING_FIELD" }))

  function hasExactly(bundle, number, resourceType) {
    return bundle["entry"] && bundle["entry"].map(entry => entry["resource"]  || {}).filter(resource => resource.resourceType === resourceType).length === number;
  }
}

// Result Models

function success(value) {
  return () => Validation.of(value);
}

function fail(value) {
  return () => Fail([value]);
}

// Exports

module.exports = {
  getStatusCode,
  verifyPrescriptionBundle,
  verifyPrescriptionAndSignatureBundle
}
