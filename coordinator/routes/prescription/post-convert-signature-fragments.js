const requestValidator = require("../../validators/request-validator")
const translator = require("../../services/translation-service")

module.exports = [
  /*
    Convert a FHIR prescription into the HL7 V3 signature fragments to be signed by the prescriber.
  */
  {
    method: 'POST',
    path: '/ConvertSignatureFragments',
    handler: async (request, h) => {
      requestValidator.verifyPrescriptionBundle(request.payload)
      const hl7V3FullMessage = translator.convertFhirMessageToHl7V3ParentPrescription(request.payload)
      const canonicalizedHl7V3SignedInfo = await translator.convertHl7V3MessageToHl7V3SignatureFragments(hl7V3FullMessage)
      return h.response(canonicalizedHl7V3SignedInfo)
    }
  }
]
