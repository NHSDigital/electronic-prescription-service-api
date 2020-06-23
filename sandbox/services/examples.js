const fs = require('fs')

module.exports = {
  PrepareSuccessResponse: JSON.parse(fs.readFileSync('mocks/PrepareSuccessResponse.json')),
  SendSuccessResponse: JSON.parse(fs.readFileSync('mocks/SendSuccessResponse.json')),
  SendErrorPatientDeceasedResponse: JSON.parse(fs.readFileSync('mocks/SendErrorPatientDeceasedResponse.json'))
}
