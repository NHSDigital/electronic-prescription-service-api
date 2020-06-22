//const fhirHelper = require('../../helpers/fhir-helper')
const requestBodyParser = require("../../services/request-body-parser")
const requestValidator = require("../../validators/request-validator")
const responseBuilder = require("../../services/response-builder")

module.exports = [
  /*
    Convert a FHIR prescription into the HL7 V3 signature elements to be signed by the prescriber.
  */
  {
    method: 'POST',
    path: '/Prepare',
    handler: (request, h) => {
      var requestBody = requestBodyParser.parse(request)
      var validation = requestValidator.verifyPrescriptionBundle(requestBody)
      var response = responseBuilder.create(validation, requestBody.id)
      var statusCode = requestValidator.getStatusCode(validation)
      //TODO add meta to the response schema and use fhirHelper
      //return fhirHelper.createFhirResponse(h, examples.prescriptionPostSuccessResponse)
      return h.response(response).code(statusCode)
    }
  }
]
