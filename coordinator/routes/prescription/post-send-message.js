const requestValidator = require("../../validators/request-validator")

module.exports = [
  /*
    Send a signed message on to SPINE.
  */
  {
    method: 'POST',
    path: '/Send',
    handler: (request, h) => {
      requestValidator.verifyPrescriptionAndSignatureBundle(request.payload)
      return h.response("Message Sent")
    }
  }
]
