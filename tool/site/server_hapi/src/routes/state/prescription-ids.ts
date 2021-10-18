import Hapi from "@hapi/hapi"
//import {getSessionValue} from "../../services/session"

export default [
  {
    method: "GET",
    path: "/prescriptionIds",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prescriptionId = request.yar.get("prescription_id")
      const prescriptionIds = request.yar.get("prescription_ids")
      return h.response({
        "prescriptionIds": prescriptionIds,
        "prescriptionId": prescriptionId
      }).code(200)
    }
  }
]