import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {Bundle} from "fhir/r4"
import {getEpsClient} from "../../services/communication/eps-client"
import {getApigeeAccessTokenFromSession} from "../../services/session"
import {getCorrelationId} from "../util"

export default [
  {
    method: "POST" as RouteDefMethods,
    path: "/prescribe/cancel",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const cancelRequest = request.payload as Bundle
      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const correlationId = getCorrelationId(request)
      const cancelResponse = await epsClient.makeSendRequest(cancelRequest, correlationId)
      const cancelResponseHl7 = await epsClient.makeConvertRequest(cancelRequest, correlationId)
      const success = cancelResponse.statusCode === 200
      return responseToolkit.response({
        success: success,
        request_xml: cancelResponseHl7,
        request: cancelRequest,
        response: cancelResponse.fhirResponse,
        response_xml: cancelResponse.spineResponse
      }).code(200)
    }
  }
]
