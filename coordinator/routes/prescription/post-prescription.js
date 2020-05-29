const requestValidator = require("../../validators/request-validator")
const translator = require("../../services/translation-service")

module.exports = [
  /*
    Convert a FHIR prescription into the HL7 V3 signature elements to be signed by the prescriber.
  */
  {
    method: 'POST',
    path: '/Convert-Signature-fragments',
    handler: (request, h) => {
      requestValidator.verifyPrescriptionBundle(request.payload)
      return h.response(translator.fhirToHl7v3(request.payload))
    }
  }
]
