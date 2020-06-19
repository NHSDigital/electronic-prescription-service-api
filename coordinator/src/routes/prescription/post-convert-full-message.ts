import * as requestValidator from "../../validators/request-validator"
import * as requestBodyParser from "../../services/request-body-parser"
import * as responseBuilder from "../../services/response-builder"
import Hapi from "@hapi/hapi";

export default [
    /*
      Convert a FHIR prescription message into an HL7 V3 ParentPrescription message.
    */
    {
        method: 'POST',
        path: '/Convert',
        handler: (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Hapi.ResponseObject => {
            const requestBody = requestBodyParser.parse(request)
            const validation = requestValidator.verifyPrescriptionBundle(requestBody)
            const statusCode = requestValidator.getStatusCode(validation)
            const response = responseBuilder.createPrescription(validation, requestBody)
            return responseToolkit.response(response).code(statusCode)
        }
    }
]
