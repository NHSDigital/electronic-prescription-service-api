import * as requestValidator from "../../validators/request-validator"
import * as translator from "../../services/translation-service"
import Hapi from "@hapi/hapi"
import {Bundle} from "../../services/fhir-resources"

export default [
    /*
      Convert a FHIR prescription into the HL7 V3 signature fragments to be signed by the prescriber.
    */
    {
        method: 'POST',
        path: '/Prepare',
        handler: (request: Hapi.Request, h: Hapi.ResponseToolkit): Hapi.ResponseObject => {
            requestValidator.verifyPrescriptionBundle(request.payload)
            const signedInfo = translator.convertFhirMessageToHl7V3SignedInfo(request.payload as Bundle)
            return h.response(signedInfo)
        }
    }
]
