import Hapi from "@hapi/hapi"
import {getSessionValue} from "../../services/session"
import {getEpsClient} from "../../services/communication/eps-client"
import {FhirResource} from "fhir/r4"

export default [
  {
    method: "POST",
    path: "/validate",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const validateRequest = request.payload as FhirResource
      const accessToken = getSessionValue("access_token", request)
      const epsClient = getEpsClient(accessToken, request)
      const validateResponse = await epsClient.makeValidateRequest(validateRequest)
      const sendResult = {
        success: !validateResponse.fhirResponse.issue.some(issue => issue.severity === "error"),
        request: validateRequest,
        response: validateResponse.fhirResponse
      }
      return responseToolkit.response(sendResult).code(200)
    }
  }
]
