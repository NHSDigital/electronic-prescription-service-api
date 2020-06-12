//const fhirHelper = require('../../helpers/fhir-helper')
const requestValidator = require("../../validators/request-validator")
const responseBuilder = require("../../services/response-builder")

module.exports = [
  /*
    Send the signed prescription to EPS.
  */
  {
    method: 'PUT',
    path: '/Prescription',
    handler: (request, h) => {
      var validation = requestValidator.verifyPrescriptionAndSignatureBundle(request.payload)
      var response = responseBuilder.create(validation, request.payload.id)
      var statusCode = requestValidator.getStatusCode(validation)
      //TODO add meta to the response schema and use fhirHelper
      //return fhirHelper.createFhirResponse(h, examples.prescriptionPostSuccessResponse)
      return h.response(response).code(statusCode)
    }
  }
]
