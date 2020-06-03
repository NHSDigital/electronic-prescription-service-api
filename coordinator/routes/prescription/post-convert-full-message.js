const requestValidator = require("../../validators/request-validator")
const translator = require("../../services/translation-service")

module.exports = [
  /*
    Convert a FHIR prescription message into an HL7 V3 ParentPrescription message.
  */
  {
    method: 'POST',
    path: '/ConvertFullMessage',
    handler: (request, h) => {
      requestValidator.verifyPrescriptionBundle(request.payload)
      const convertedMessage = translator.convertFhirMessageToHl7V3ParentPrescription(request.payload)
      return h.response(Buffer.from(convertedMessage, 'binary').toString('base64'))
    }
  }
]
