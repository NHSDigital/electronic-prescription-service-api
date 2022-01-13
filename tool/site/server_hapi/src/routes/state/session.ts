import Hapi from "@hapi/hapi"
import {getSessionValue} from "../../services/session"
import * as fhir from "fhir/r4"

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
      const prescriptionIds = getSessionValue("prescription_ids", request)
      if (!prescriptionIds) {
        return h.response({summaries:[]}).code(200) 
      }
      const prescriptions = prescriptionIds.map((id: string) => {
        const prescription =
          getSessionValue(`release_response_${id}`, request)
          ?? getSessionValue(`prescription_order_send_request_${id}`, request)
        return {id, prescription}
      })  
      const summaries = prescriptions.map((prescription: {id: string, prescription: fhir.Bundle}) => {
        return {
          id: prescription.id,
          status: "Something"
        }
      })
      return h.response({summaries}).code(200)
    }
  }
]
