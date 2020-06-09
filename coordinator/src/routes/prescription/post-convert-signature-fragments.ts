import * as requestValidator from "../../validators/request-validator"
import * as translator from "../../services/translation-service"
import Hapi from "@hapi/hapi";
import {Bundle} from "../../services/fhir-resources";

function convertSignatureFragments(request: Hapi.Request, h: Hapi.ResponseToolkit): Hapi.ResponseObject {
    //TODO - is it okay to cast this to a Bundle?
    requestValidator.verifyPrescriptionBundle(<Bundle>request.payload)
    const signatureFragments = translator.convertFhirMessageToHl7V3SignatureFragments(<Bundle>request.payload)
    return h.response(signatureFragments)
}

export const routes = [
    /*
      Convert a FHIR prescription into the HL7 V3 signature fragments to be signed by the prescriber.
    */
    {
        method: 'POST',
        path: '/ConvertSignatureFragments',
        handler: convertSignatureFragments
    }
]
