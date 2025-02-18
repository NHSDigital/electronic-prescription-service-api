import Hapi, {RouteDefMethods} from "@hapi/hapi"
import * as fhir from "fhir/r4"
import {getEpsClient} from "../../services/communication/eps-client"
import {getApigeeAccessTokenFromSession} from "../../services/session"
import {getCorrelationId} from "../util"

export default [
  {
    method: "POST" as RouteDefMethods,
    path: "/api/convert",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const resource = request.payload as fhir.FhirResource

      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)

      request.logger.debug(`Received Resource with id: ${resource.id}. Sending to Convert.`)
      const correlationId = getCorrelationId(request)
      const convertedResource = await epsClient.makeConvertRequest(resource, correlationId)
      request.logger.debug(`Converted ${resource.id}`)

      return responseToolkit.response(convertedResource).code(200)
    }
  }
]
