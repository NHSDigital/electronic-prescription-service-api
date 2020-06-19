const fs = require('fs')

module.exports = {
  //PrepareSuccessRequest: JSON.parse(fs.readFileSync('mocks/PrepareSuccessRequest.json')),
  PrepareSuccessResponse: JSON.parse(fs.readFileSync('mocks/PrepareSuccessResponse.json')),
  //SendSuccessRequest: JSON.parse(fs.readFileSync('mocks/SendSuccessRequest.json')),
  SendSuccessResponse: JSON.parse(fs.readFileSync('mocks/SendSuccessResponse.json')),
  SendErrorPatientDeceasedResponse: JSON.parse(fs.readFileSync('mocks/SendErrorPatientDeceasedResponse.json')),
  SendErrorDuplicatePrescriptionResponse: JSON.parse(fs.readFileSync('mocks/SendErrorDuplicatePrescriptionResponse.json')),
  SendErrorDigitalSignatureNotFoundResponse: JSON.parse(fs.readFileSync('mocks/SendErrorDigitalSignatureNotFoundResponse.json')),
  SendErrorPatientNotFoundResponse: JSON.parse(fs.readFileSync('mocks/SendErrorPatientNotFoundResponse.json')),
  SendErrorInformationMissingResponse: JSON.parse(fs.readFileSync('mocks/SendErrorInformationMissingResponse.json')),
  SendErrorInvalidMessageResponse: JSON.parse(fs.readFileSync('mocks/SendErrorInvalidMessageResponse.json')),
  SendErrorIncorrectItemCountResponse: JSON.parse(fs.readFileSync('mocks/SendErrorIncorrectItemCountResponse.json')),
  SendErrorAuthorisedRepeatMismatchResponse: JSON.parse(fs.readFileSync('mocks/SendErrorAuthorisedRepeatMismatchResponse.json')),
  SendErrorIncorrectRepeatNumberResponse: JSON.parse(fs.readFileSync('mocks/SendErrorIncorrectRepeatNumberResponse.json')),
  SendErrorIncompatibleVersionResponse: JSON.parse(fs.readFileSync('mocks/SendErrorIncompatibleVersionResponse.json')),
  SendErrorDuplicateItemIdResponse: JSON.parse(fs.readFileSync('mocks/SendErrorDuplicateItemIdResponse.json')),
  SendErrorCheckDigitErrorResponse: JSON.parse(fs.readFileSync('mocks/SendErrorCheckDigitErrorResponse.json')),
  SendErrorInvalidDateFormatResponse: JSON.parse(fs.readFileSync('mocks/SendErrorInvalidDateFormatResponse.json')),
}
