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
      const claimedPrescriptionIds: Array<string> = getSessionValue("claimed_prescription_ids", request) ?? []

      return h.response({
        sentPrescriptions: sentPrescriptionIds,
        releasedPrescriptions: releasedPrescriptionIds,
        dispensedPrescriptions: dispensedPrescriptionIds,
        claimedPrescriptions: claimedPrescriptionIds
      }).code(200)
    }
  }
]
