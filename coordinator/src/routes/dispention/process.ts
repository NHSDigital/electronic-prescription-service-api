import * as fhir from "../../models/fhir/fhir-resources"
import Hapi from "@hapi/hapi"
import {validatingHandler} from "../util"
import {createOperationOutcomeIssue} from "../../services/translation/spine-response"

export default [
  /*
    Send a dispense request to SPINE
  */
  {
    method: "POST",
    path: "/dispense/$process-message",
    handler: validatingHandler(
      async (bundle: fhir.Bundle, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        request.logger.info("Sandbox process response")
        return responseToolkit.response(createOperationOutcomeIssue(200))
      }
    )
  } as Hapi.ServerRoute
]
