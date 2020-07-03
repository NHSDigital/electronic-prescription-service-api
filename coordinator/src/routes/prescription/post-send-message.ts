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
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<unknown> => {
        const requestBody = requestBodyParser.parse(request)
        const validation = requestValidator.verifyPrescriptionBundle(requestBody, true)
        const response = await responseBuilder.sendMessage(validation, requestBody)
        return responseToolkit.response(response.body).code(response.statusCode)
    }
  }
]
