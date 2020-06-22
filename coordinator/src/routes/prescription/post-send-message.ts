import * as requestValidator from "../../validators/request-validator"
import Hapi from "@hapi/hapi"
import * as requestBodyParser from "../../services/request-body-parser";
import * as responseBuilder from "../../services/response-builder";

export default [
  /*
    Send a signed message on to SPINE.
  */
  {
    method: 'POST',
    path: '/Send',
    handler: (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Hapi.ResponseObject => {
        const requestBody = requestBodyParser.parse(request)
        const validation = requestValidator.verifyPrescriptionBundle(requestBody, true)
        const statusCode = requestValidator.getStatusCode(validation)
        const response = responseBuilder.sendMessage(validation)
        return responseToolkit.response(response).code(statusCode)
    }
  }
]
