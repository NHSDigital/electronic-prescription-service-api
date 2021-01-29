import * as translator from "../../services/translation"
import {Bundle} from "../../models/fhir/fhir-resources"
import {requestHandler} from "../../services/handlers"
import Hapi from "@hapi/hapi"
import Joi from "@hapi/joi"
import {createHash, handleResponse, validatingHandler} from "../util"

export default [
  /*
      Send a signed message on to SPINE.
    */
  {
    method: "POST",
    path: "/$process-message",
    options: {
      validate:{
        headers: Joi.object({
          "X-Request-ID": Joi.string().guid().required()
        }),
        options: {
          allowUnknown: true
        }
      }
    },
    handler: validatingHandler(
      async (requestPayload: Bundle, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        request.logger.info("Building Spine request")
        const spineRequest = translator.convertFhirMessageToSpineRequest(requestPayload)
        request.log("audit", {"incomingMessageHash": createHash(JSON.stringify(requestPayload))})
        request.logger.info("Awaiting response")
        const spineResponse = await requestHandler.send(spineRequest, request.headers["X-Request-ID"], request.logger)
        return handleResponse(request, spineResponse, responseToolkit)
      }
    )
  } as Hapi.ServerRoute
]
