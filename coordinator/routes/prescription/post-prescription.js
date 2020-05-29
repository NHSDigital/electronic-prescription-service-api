const Boom = require('boom')
const examples = require('../../services/examples')
//const fhirHelper = require('../../helpers/fhir-helper')
const requestValidator = require("../../validators/request-validator")

module.exports = [
  /*
    Convert a FHIR prescription into the HL7 V3 signature elements to be signed by the prescriber.
  */
  {
    method: 'POST',
    path: '/Prescription',
    handler: (request, h) => {
      requestValidator.verifyPrescriptionBundle(request.payload)
      if (request.payload.id === examples.prescriptionPostSuccessRequest.id) {
        //TODO add meta to the response schema and use fhirHelper
        //return fhirHelper.createFhirResponse(h, examples.prescriptionPostSuccessResponse)
        return h.response(examples.prescriptionPostSuccessResponse)
      } else {
        throw Boom.badRequest("Unsupported prescription id", {operationOutcomeCode: "value", apiErrorCode: "unsupportedPrescriptionId"})
      }
    }
  }
]
