import Hapi from "@hapi/hapi"
import {
  appendToSessionValue,
  getSessionValue,
  removeFromSessionValue,
  setSessionValue,
  clearSessionValue
} from "../../services/session"
import {Bundle, Task} from "fhir/r4"
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
        const prescriptionId = withdrawRequest.groupIdentifier?.value
        const dispenseNotificationRequestKey = `dispense_notification_requests_${prescriptionId}`

        const dispenseNotificationRequests = getSessionValue(dispenseNotificationRequestKey, request) as Bundle[]
        const newDispenseNotifications = dispenseNotificationRequests.slice(0, -1)

        if (newDispenseNotifications.length === 0) {
          clearSessionValue(dispenseNotificationRequestKey, request)
          appendToSessionValue("released_prescription_ids", [prescriptionId], request)
          removeFromSessionValue("dispensed_prescription_ids", prescriptionId, request)
        } else {
          setSessionValue(dispenseNotificationRequestKey, newDispenseNotifications, request)
        }
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
