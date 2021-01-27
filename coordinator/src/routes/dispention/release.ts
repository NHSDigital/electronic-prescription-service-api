import * as fhir from "../../models/fhir/fhir-resources"
import * as Hapi from "@hapi/hapi"
import {taskValidatorHandler} from "../util"

export default [
  /*
    Send a dispense release request to SPINE
  */
  {
    method: "POST",
    path: "/Task/$release",
    handler: taskValidatorHandler(
      async (bundle: fhir.Parameters, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        request.logger.info("Sandbox release response")
        const messageId = "d5a20db9-6d76-4aeb-a190-9a85843b01bf"
        const sandboxResponse: fhir.Bundle = {
          resourceType: "Bundle",
          type: "searchSet",
          id: messageId,
          identifier: {
            value: messageId
          }
          //TODO: find reasonable task response
        }
        return responseToolkit.response(sandboxResponse)
      }
    )
  } as Hapi.ServerRoute
]
