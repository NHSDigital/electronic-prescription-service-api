import Hapi from "@hapi/hapi"
import {getSessionValue, removeFromSessionValue} from "../../services/session"
import {Task} from "fhir/r4"
import {getEpsClient} from "../../services/communication/eps-client"

export default [
  {
    method: "POST",
    path: "/dispense/withdraw",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const withdrawRequest = request.payload as Task
      const accessToken = getSessionValue("access_token", request)
      const epsClient = getEpsClient(accessToken)
      const withdrawResponse = await epsClient.makeWithdrawRequest(withdrawRequest)
      const withdrawRequestHl7 = await epsClient.makeConvertRequest(withdrawRequest)
      const success = withdrawResponse.statusCode === 200
      if (success) {
        removeFromSessionValue("dispensed_prescription_ids", withdrawRequest.groupIdentifier?.value, request)
      }
      return responseToolkit.response({
        success,
        request_xml: withdrawRequestHl7,
        request: withdrawRequest,
        response: withdrawResponse.fhirResponse,
        response_xml: withdrawResponse.spineResponse
      }).code(200)
    }
  }
]
