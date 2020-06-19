import * as requestValidator from "../../validators/request-validator"
import * as translator from "../../services/translation-service"
import Hapi from "@hapi/hapi"
import {Bundle} from "../../services/fhir-resources"
import * as requestBodyParser from "../../services/request-body-parser";
import * as responseBuilder from "../../services/response-builder";

export default [
    /*
      Convert a FHIR prescription into the HL7 V3 signature fragments to be signed by the prescriber.
    */
    {
        method: 'POST',
        path: '/Prepare',
        handler: (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Hapi.ResponseObject => {
            const requestBody = requestBodyParser.parse(request)
            const validation = requestValidator.verifyPrescriptionBundle(requestBody)
            const statusCode = requestValidator.getStatusCode(validation)
            const response = responseBuilder.createSignedInfo(validation, requestBody)
            return responseToolkit.response(response).code(statusCode)
        }
    }
]
