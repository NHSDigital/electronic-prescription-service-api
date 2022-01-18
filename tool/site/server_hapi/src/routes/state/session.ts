import Hapi from "@hapi/hapi"
import {getSessionValue} from "../../services/session"

export default [
  {
    method: "GET",
    path: "/session",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prescriptionId = getSessionValue("prescription_id", request)
      const prescriptionIds = getSessionValue("prescription_ids", request)
      return h.response({
        "prescriptionIds": prescriptionIds,
        "prescriptionId": prescriptionId
      }).code(200)
    }
  },
  {
    method: "GET",
    path: "/prescriptions",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prescriptionIds: Array<string> = getSessionValue("prescription_ids", request)
      if (!prescriptionIds) {
        return h.response({sentPrescriptions:[], releasedPrescriptions:[]}).code(200)
      }

      const releasedPrescriptions = prescriptionIds.map((id: string) => {
        const prescription = getSessionValue(`release_response_${id}`, request)
        return {id, prescription}
      }).filter(Boolean)

      const sentPrescriptionIds = prescriptionIds.filter(
        (id: string) => releasedPrescriptions.map(rp => rp.id).indexOf(id) === -1)

      const sentPrescriptions = sentPrescriptionIds.map((id: string) => {
        const prescription = getSessionValue(`prescription_order_send_request_${id}`, request)
        return {id, prescription}
      }).filter(Boolean)

      return h.response({
        sentPrescriptions,
        releasedPrescriptions
      }).code(200)
    }
  }
]
