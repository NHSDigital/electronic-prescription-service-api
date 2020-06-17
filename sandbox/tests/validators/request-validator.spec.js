const validator = require("../../validators/request-validator")
const validPrescriptionBundle = require("../resources/valid-bundle.json")
const validPrescriptionBundleWithSignature = require("../resources/valid-bundle-with-signature.json")
const {Success} = require('monet');

test('it should return an array of validation error objects when given an empty json object', () => {
  expect(validator.verifyPrescriptionBundle({}))
      .toEqual([{"apiErrorCode": "UNSUPPORTED_ID", "message": "Unsupported 'id'", "operationOutcomeCode": "value"}, {"apiErrorCode": "INCORRECT_RESOURCETYPE", "message": "ResourceType must be 'Bundle' on request", "operationOutcomeCode": "value"}, {"apiErrorCode": "MISSING_FIELD", "message": "ResourceType Bundle must contain 'entry' field", "operationOutcomeCode": "value"}, {"apiErrorCode": "MISSING_FIELD", "message": "Bundle entry must contain exactly 1 resource(s) of type Patient", "operationOutcomeCode": "value"}, {"apiErrorCode": "MISSING_FIELD",
      "message": "Bundle entry must contain exactly 1 resource(s) of type Encounter", "operationOutcomeCode": "value"}, {"apiErrorCode": "MISSING_FIELD", "message": "Bundle entry must contain exactly 2 resource(s) of type Organization", "operationOutcomeCode": "value"}])
})

test('verifyPrescriptionAndSignatureBundle should return an array of validation error objects when given an empty json object', () => {
  expect(validator.verifyPrescriptionAndSignatureBundle({})).toEqual([{"apiErrorCode": "UNSUPPORTED_ID", "message": "Unsupported 'id'", "operationOutcomeCode": "value"}, {"apiErrorCode": "INCORRECT_RESOURCETYPE", "message": "ResourceType must be 'Bundle' on request", "operationOutcomeCode": "value"}, {"apiErrorCode": "MISSING_FIELD", "message": "ResourceType Bundle must contain 'entry' field", "operationOutcomeCode": "value"}, {"apiErrorCode": "MISSING_FIELD", "message": "Bundle entry must contain exactly 1 resource(s) of type Provenance", "operationOutcomeCode": "value"}])
})

test('verifyPrescriptionBundle accepts bundle with required resources', () => {
  expect(validator.verifyPrescriptionBundle(validPrescriptionBundle).toString()).toEqual(Success().acc().val.toString())
})

test('verifyPrescriptionAndSignatureBundle accepts bundle with required resources', () => {
  expect(validator.verifyPrescriptionAndSignatureBundle(validPrescriptionBundleWithSignature).toString()).toBe(Success().acc().val.toString())
})

test('getStatusCode returns 200 when message passes validation', () => {
  const validationResult = Success().acc().val
  expect(validator.getStatusCode(validationResult).toString()).toBe("200")
})

test('getStatusCode returns 400 when message fails validation', () => {
  const validationResult = validator.verifyPrescriptionBundle({})
  expect(validator.getStatusCode(validationResult).toString()).toBe("400")
})
