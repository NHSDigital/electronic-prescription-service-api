import * as requestValidator from "../../validators/request-validator"
import * as translator from "../../services/translation-service"
import Hapi from "@hapi/hapi";
import {Bundle} from "../../services/fhir-resources";

function convertFullMessage(request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Hapi.ResponseObject {
    //TODO - is it okay to cast this to a Bundle?
    requestValidator.verifyPrescriptionBundle(<Bundle>request.payload)
    return responseToolkit.response(translator.convertFhirMessageToHl7V3ParentPrescription(<Bundle>request.payload))
}

export const routes = [
    /*
      Convert a FHIR prescription message into an HL7 V3 ParentPrescription message.
    */
    {
        method: 'POST',
        path: '/ConvertFullMessage',
        handler: convertFullMessage
    }
]
