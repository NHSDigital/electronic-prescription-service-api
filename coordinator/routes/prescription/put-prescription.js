const Boom = require('boom')
const examples = require('../../services/examples')
//const fhirHelper = require('../../helpers/fhir-helper')
const requestValidator = require("../../validators/request-validator")

module.exports = [
  /*
    Send the signed prescription to EPS.
  */
  {
    method: 'PUT',
    path: '/Prescription',
    handler: (request, h) => {
      requestValidator.verifyPrescriptionAndSignatureBundle(request.payload)
      if (request.payload.id === examples.prescriptionPutSuccessRequest.id) {
        //TODO add meta to the response schema and use fhirHelper
        //return fhirHelper.createFhirResponse(h, examples.prescriptionPostSuccessResponse)
        return h.response(examples.prescriptionPutSuccessResponse)
      } else {
        throw Boom.badRequest("Unsupported prescription id", {operationOutcomeCode: "value", apiErrorCode: "unsupportedPrescriptionId"})
      }
    }
  }
]
