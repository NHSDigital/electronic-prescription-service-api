const Boom = require('boom')
const requestValidator = require("../../validators/request-validator")

module.exports = [
  /*
    Send the signed prescription to EPS.
  */
  {
    method: 'POST',
    path: '/Create-Prescription',
    handler: (request, h) => {
      requestValidator.verifyPrescriptionAndSignatureBundle(request.payload)
      return h.response("examples.prescriptionPutSuccessResponse")
    }
  }
]
