import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {getSessionValue, getSessionValueOrDefault, setSessionValue} from "../../services/session"
import {getSessionPrescriptionIdsArray} from "../util"

export default [
  {
    method: "GET" as RouteDefMethods,
    path: "/prescriptionIds",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      // eslint-disable-next-line max-len
      const editPrescriptionsIds: Array<{bundleId: string, prescriptionId: string}> = getSessionValueOrDefault("prescription_ids", request, [])
      const sentPrescriptionIds: Array<string> = getSessionValueOrDefault("sent_prescription_ids", request, [])
      const releasedPrescriptionIds: Array<string> = getSessionValueOrDefault("released_prescription_ids", request, [])
      // eslint-disable-next-line max-len
      const dispensedPrescriptionIds: Array<string> = getSessionValueOrDefault("dispensed_prescription_ids", request, [])
      const claimedPrescriptionIds: Array<string> = getSessionValueOrDefault("claimed_prescription_ids", request, [])

      return h.response({
        editingPrescriptions: editPrescriptionsIds,
        sentPrescriptions: sentPrescriptionIds,
        releasedPrescriptions: releasedPrescriptionIds,
        dispensedPrescriptions: dispensedPrescriptionIds,
        claimedPrescriptions: claimedPrescriptionIds
      }).code(200)
    }
  },
  {
    method: "GET" as RouteDefMethods,
    path: "/prescription/{prescriptionId}",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const shortPrescriptionId = request.params.prescriptionId
      setSessionValue("prescription_id", shortPrescriptionId, request)
      const bundle = getSessionValue(`prepare_request_${shortPrescriptionId}`, request)
      return h.response(bundle).code(200)
    }
  },
  {
    method: "GET" as RouteDefMethods,
    path: "/prescriptions",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prescriptionIds = getSessionPrescriptionIdsArray(request)
      const bundles = prescriptionIds.map((id: string) =>
        getSessionValue(`prepare_request_${id}`, request)
      )
      return h.response(bundles).code(200)
    }
  }
]
