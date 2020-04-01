const patients = require('../../services/patients')
const fhirHelper = require('../../helpers/fhir-helper')
const nhsNumberHelper = require('../../helpers/nhs-number-helper')

module.exports = [
  /*
    TODO endpoint description
  */
  {
    //TODO endpoint definition, e.g.:
    method: 'GET',
    path: '/Patient/{nhsNumber}',
    handler: (request, h) => {
      nhsNumberHelper.checkNhsNumber(request)
      return fhirHelper.createFhirResponse(h, patients.examplePatientSmith)
    }
  }
]
