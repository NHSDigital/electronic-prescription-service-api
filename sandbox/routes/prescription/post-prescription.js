const Boom = require('boom')
const examples = require('../../services/examples')
//const fhirHelper = require('../../helpers/fhir-helper')

module.exports = [
  /*
    Convert a FHIR prescription into the HL7 V3 signature elements to be signed by the prescriber.
  */
  {
    method: 'POST',
    path: '/Prescription',
    handler: (request, h) => {
      //TODO check payload and id present
      //TODO validate more fields
      const prescription = JSON.parse(request.payload)
      if (prescription.id === examples.prescriptionPostSuccessRequest.id) {
        //TODO add meta to the response schema and use fhirHelper
        //return fhirHelper.createFhirResponse(h, examples.prescriptionPostSuccessResponse)
        return h.response(examples.prescriptionPostSuccessResponse)
      } else {
        console.log(prescription.id)
        console.log(examples.prescriptionPostSuccessRequest.id)
        throw Boom.badRequest("Unsupported prescription id", {operationOutcomeCode: "value", apiErrorCode: "unsupportedPrescriptionId"})
      }
    }
  }
]
