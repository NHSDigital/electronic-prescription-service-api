const fs = require('fs')

module.exports = {
  prescriptionPostSuccessRequest: JSON.parse(fs.readFileSync('mocks/PrescriptionPostSuccessRequest.json')),
  prescriptionPostSuccessResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPostSuccessResponse.json')),
  prescriptionPutSuccessRequest: JSON.parse(fs.readFileSync('mocks/PrescriptionPutSuccessRequest.json')),
  prescriptionPutSuccessResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPutSuccessResponse.json'))
}
