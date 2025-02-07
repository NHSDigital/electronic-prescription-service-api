import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {getApigeeAccessTokenFromSession, removeFromSessionValue} from "../../services/session"
import {Task} from "fhir/r4"
import {getEpsClient} from "../../services/communication/eps-client"
import {getCorrelationId} from "../util"

export default [
  {
    method: "POST" as RouteDefMethods,
    path: "/dispense/return",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const releaseRequest = request.payload as Task
      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const correlationId = getCorrelationId(request)
      const returnResponse = await epsClient.makeReturnRequest(releaseRequest, correlationId)
      const returnRequestHl7 = await epsClient.makeConvertRequest(releaseRequest, correlationId)
      const success = returnResponse.statusCode === 200
      if (success) {
        removeFromSessionValue("released_prescription_ids", releaseRequest.groupIdentifier?.value, request)
      }
      return responseToolkit.response({
        success,
        request_xml: returnRequestHl7,
        request: releaseRequest,
        response: returnResponse.fhirResponse,
        response_xml: returnResponse.spineResponse
      }).code(200)
    }
  }
]
