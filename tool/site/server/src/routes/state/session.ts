import Hapi from "@hapi/hapi"
import {getSessionValue} from "../../services/session"

export default [
  {
    method: "GET",
    path: "/prescriptions",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const sentPrescriptionIds: Array<string> = getSessionValue("sent_prescription_ids", request) ?? []
      const releasedPrescriptionIds: Array<string> = getSessionValue("released_prescription_ids", request) ?? []
      const dispensedPrescriptionIds: Array<string> = getSessionValue("dispensed_prescription_ids", request) ?? []

      const sentPrescriptions = sentPrescriptionIds.map((id: string) => {
        const prescription = getSessionValue(`prescription_order_send_request_${id}`, request)
        return {id, prescription}
      }).filter(Boolean)

      const releasedPrescriptions = releasedPrescriptionIds.map((id: string) => {
        const prescription = getSessionValue(`release_response_${id}`, request)
        return {id, prescription}
      }).filter(Boolean)

      const dispensedPrescriptions = dispensedPrescriptionIds.map((id: string) => {
        const prescription = getSessionValue(`dispense_notification_requests_${id}`, request).pop()
        return {id, prescription}
      }).filter(Boolean)

      return h.response({
        sentPrescriptions,
        releasedPrescriptions,
        dispensedPrescriptions
      }).code(200)
    }
  }
]
