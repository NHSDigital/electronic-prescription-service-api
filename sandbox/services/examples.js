const fs = require('fs')

module.exports = {
  prescriptionPostSuccessRequest: JSON.parse(fs.readFileSync('mocks/PrescriptionPostSuccessRequest.json')),
  prescriptionPostSuccessResponse: JSON.parse(fs.readFileSync('mocks/PrescriptionPostSuccessResponse.json'))
}
