import Hapi from "@hapi/hapi"
import {getSessionValue} from "../../services/session"

export default [
  {
    method: "GET",
    path: "/prescriptionIds",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prescriptionId = getSessionValue("prescription_id", request)
      const prescriptionIds = getSessionValue("prescription_ids", request)
      return h.response({
        "prescriptionIds": prescriptionIds,
        "prescriptionId": prescriptionId
      }).code(200)
    }
  }
]
