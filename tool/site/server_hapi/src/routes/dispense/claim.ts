import Hapi from "@hapi/hapi"
import {getSessionValue} from "../../services/session"
import {Claim} from "fhir/r4"
import {getEpsClient} from "../../services/communication/eps-client"

export default [
  {
    method: "POST",
    path: "/dispense/claim",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const claimRequest = request.payload as Claim
      const accessToken = getSessionValue("access_token", request)
      const epsClient = getEpsClient(accessToken)
      const claimResponse = await epsClient.makeClaimRequest(claimRequest)
      const claimResponseHl7 = await epsClient.makeConvertRequest(claimRequest)
      const success = claimResponse.statusCode === 200
      return responseToolkit.response({
        success: success,
        request_xml: claimResponseHl7,
        request: claimRequest,
        response: claimResponse.fhirResponse,
        response_xml: claimResponse.spineResponse
      }).code(200)
    }
  }
]
