const validator = require("../validators/request-validator")

test('it should return an array of validation error objects when given an empty json object', () => {
  expect(validator.verifyPrescriptionBundle({}))
      .toEqual([{"apiErrorCode": "UNSUPPORTED_ID", "message": "Unsupported 'id'", "operationOutcomeCode": "value"}, {"apiErrorCode": "INCORRECT_RESOURCETYPE", "message": "ResourceType must be 'Bundle' on request", "operationOutcomeCode": "value"}, {"apiErrorCode": "MISSING_FIELD", "message": "ResourceType Bundle must contain 'entry' field", "operationOutcomeCode": "value"}, {"apiErrorCode": "MISSING_FIELD", "message": "Bundle entry must contain exactly 1 resource(s) of type Patient", "operationOutcomeCode": "value"}, {"apiErrorCode": "MISSING_FIELD", 
      "message": "Bundle entry must contain exactly 1 resource(s) of type Encounter", "operationOutcomeCode": "value"}, {"apiErrorCode": "MISSING_FIELD", "message": "Bundle entry must contain exactly 2 resource(s) of type Organization", "operationOutcomeCode": "value"}])
})