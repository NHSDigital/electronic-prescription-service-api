const requestValidator = require("../../validators/request-validator")
const translator = require("../../services/translation-service")

module.exports = [
  /*
    Convert a FHIR prescription into the HL7 V3 signature fragments to be signed by the prescriber.
  */
  {
    method: 'POST',
    path: '/ConvertSignatureFragments',
    handler: (request, h) => {
      requestValidator.verifyPrescriptionBundle(request.payload)
      const signatureFragments = translator.convertHl7V3MessageToHl7V3SignatureFragments(request.payload)
      return h.response(signatureFragments)
    }
  }
]
