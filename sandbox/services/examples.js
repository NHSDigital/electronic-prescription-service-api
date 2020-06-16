const fs = require('fs')

module.exports = {
  prescriptionPostSuccessRequest: JSON.parse(fs.readFileSync('mocks/PrescriptionPostSuccessRequest.json')),
  prescriptionPostSuccessResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPostSuccessResponse.json')),
  prescriptionPutSuccessRequest: JSON.parse(fs.readFileSync('mocks/PrescriptionPutSuccessRequest.json')),
  prescriptionPutSuccessResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPutSuccessResponse.json')),
  prescriptionPutErrorPatientDeceasedResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPutErrorPatientDeceasedResponse.json')),
  prescriptionPutErrorDuplicatePrescriptionResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPutErrorDuplicatePrescriptionResponse.json')),
  prescriptionPutErrorDigitalSignatureNotFoundResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPutErrorDigitalSignatureNotFoundResponse.json')),
  prescriptionPutErrorPatientNotFoundResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPutErrorPatientNotFoundResponse.json')),
  prescriptionPutErrorInformationMissingResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPutErrorInformationMissingResponse.json')),
  prescriptionPutErrorInvalidMessageResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPutErrorInvalidMessageResponse.json')),
  prescriptionPutErrorIncorrectItemCountResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPutErrorIncorrectItemCountResponse.json')),
  prescriptionPutErrorAuthorisedRepeatMismatchResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPutErrorAuthorisedRepeatMismatchResponse.json')),
  prescriptionPutErrorIncorrectRepeatNumberResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPutErrorIncorrectRepeatNumberResponse.json')),
  prescriptionPutErrorIncompatibleVersionResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPutErrorIncompatibleVersionResponse.json')),
  prescriptionPutErrorDuplicateItemIdResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPutErrorDuplicateItemIdResponse.json')),
  prescriptionPutErrorCheckDigitErrorResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPutErrorCheckDigitErrorResponse.json')),
  prescriptionPutErrorInvalidDateFormatResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPutErrorInvalidDateFormatResponse.json')),
}
