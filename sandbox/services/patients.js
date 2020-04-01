const fs = require('fs')

module.exports = {
  //TODO sym-link mocks from the specification/components/examples directory and reference them here, e.g.:
  examplePatientSmith: JSON.parse(fs.readFileSync('mocks/Patient.json'))
}
