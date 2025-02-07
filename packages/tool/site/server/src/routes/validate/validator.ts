import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {getApigeeAccessTokenFromSession} from "../../services/session"
import {getEpsClient} from "../../services/communication/eps-client"
import {FhirResource} from "fhir/r4"
import {getCorrelationId} from "../util"

export default [
  {
    method: "POST" as RouteDefMethods,
    path: "/validate",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const validateRequest = request.payload as FhirResource
      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const correlationId = getCorrelationId(request)
      const validateResponse = await epsClient.makeValidateRequest(validateRequest, correlationId)
      const sendResult = {
        success: !validateResponse.fhirResponse.issue.some(issue => issue.severity === "error"),
        request: validateRequest,
        response: validateResponse.fhirResponse
      }
      return responseToolkit.response(sendResult).code(200)
    }
  }
]
