import Hapi from "@hapi/hapi"
import {getSessionValue} from "../../services/session"
import {getEpsClient} from "../../services/communication/eps-client"
import {Bundle} from "fhir/r4"

export default [
  {
    method: "POST",
    path: "/dispense/verify",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const verifyRequest = request.payload as Bundle
      const accessToken = getSessionValue("access_token", request)
      const epsClient = getEpsClient(accessToken, request)
      const verifyResponse = await epsClient.makeVerifyRequest(verifyRequest)

      return responseToolkit.response({
        success: verifyResponse.statusCode === 200,
        request: verifyRequest,
        response: verifyResponse.fhirResponse
      }).code(200)
    }
  }
]
