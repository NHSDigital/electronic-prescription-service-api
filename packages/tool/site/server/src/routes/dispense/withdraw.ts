import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {
  appendToSessionValue,
  getSessionValue,
  removeFromSessionValue,
  setSessionValue,
  clearSessionValue,
  getApigeeAccessTokenFromSession
} from "../../services/session"
import {Bundle, Task} from "fhir/r4"
import {getEpsClient} from "../../services/communication/eps-client"
import {getCorrelationId} from "../util"

export default [
  {
    method: "POST" as RouteDefMethods,
    path: "/dispense/withdraw",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const withdrawRequest = request.payload as Task
      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const correlationId = getCorrelationId(request)
      const withdrawResponse = await epsClient.makeWithdrawRequest(withdrawRequest, correlationId)
      const withdrawRequestHl7 = await epsClient.makeConvertRequest(withdrawRequest, correlationId)
      const success = withdrawResponse.statusCode === 200
      if (success) {
        const prescriptionId = withdrawRequest.groupIdentifier?.value
        const dispenseNotificationRequestKey = `dispense_notification_requests_${prescriptionId}`

        const dispenseNotificationRequests = getSessionValue(dispenseNotificationRequestKey, request) as Array<Bundle>
        const newDispenseNotifications = dispenseNotificationRequests.slice(0, -1)

        const allDispenseNotificationsWithdrawn = newDispenseNotifications.length === 0
        if (allDispenseNotificationsWithdrawn) {
          removeFromSessionValue("dispensed_prescription_ids", prescriptionId, request)
          appendToSessionValue("released_prescription_ids", [prescriptionId], request)
          clearSessionValue(dispenseNotificationRequestKey, request)
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
