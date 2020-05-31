const requestValidator = require("../../validators/request-validator")
const translator = require("../../services/translation-service")

module.exports = [
  /*
    Convert a FHIR prescription into the HL7 V3 signature elements to be signed by the prescriber.
  */
  {
    method: 'POST',
    path: '/ConvertFullMessage',
    handler: (request, h) => {
      //requestValidator.verifyPrescriptionBundle(request.payload)
      return h.response(translator.convertFhirMessageToHl7V3ParentPrescription(request.payload))
    }
  }
]
