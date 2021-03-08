import * as Hapi from "@hapi/hapi"
import {basePath, handleResponse} from "../util"
import * as fhir from "../../models/fhir"
import * as translator from "../../services/translation/request"
import {spineClient} from "../../services/communication"
import {parametersValidation} from "../convert"

export default [
  /*
    Send a dispense release request to SPINE
  */
  {
    method: "POST",
    path: `${basePath}/Task/$release`,
    handler: parametersValidation(
      async (parameters: fhir.Parameters, request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        request.logger.info("Building Spine release request")
        const spineRequest = translator.convertParametersToSpineRequest(
          parameters,
          request.headers["nhsd-request-id"].toUpperCase()
        )

        const spineResponse = await spineClient.send(
          spineRequest,
          request.logger
        )

        return handleResponse(request, spineResponse, responseToolkit)
      })

  } as Hapi.ServerRoute
]
