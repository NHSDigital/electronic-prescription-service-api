import * as requestValidator from "../../validators/request-validator"
import * as translator from "../../services/translation-service"
import Hapi from "@hapi/hapi";
import {Bundle} from "../../services/fhir-resources";

export default [
    /*
      Convert a FHIR prescription message into an HL7 V3 ParentPrescription message.
    */
    {
        method: 'POST',
        path: '/Convert',
        handler: (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Hapi.ResponseObject => {
            requestValidator.verifyPrescriptionBundle(request.payload)
            return responseToolkit.response(translator.convertFhirMessageToHl7V3ParentPrescription(request.payload as Bundle))
        }
    }
]
