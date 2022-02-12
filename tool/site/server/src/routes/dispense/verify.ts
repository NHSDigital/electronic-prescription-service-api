import Hapi from "@hapi/hapi"
import {getSessionValue} from "../../services/session"
import {getEpsClient} from "../../services/communication/eps-client"

export default [
  {
    method: "POST",
    path: "/dispense/verify",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const payload = request.payload as {prescriptionId: string}
      const verifyRequest = getSessionValue(`release_response_${payload.prescriptionId}`, request)
      const accessToken = getSessionValue("access_token", request)
      const epsClient = getEpsClient(accessToken)
      const verifyResponse = await epsClient.makeVerifyRequest(verifyRequest)

      return responseToolkit.response({
        success: verifyResponse.statusCode === 200,
        request: verifyRequest,
        response: verifyResponse.fhirResponse
      }).code(200)
    }
  }
]
