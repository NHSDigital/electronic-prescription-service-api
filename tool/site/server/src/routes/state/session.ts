import Hapi from "@hapi/hapi"
import {getSessionValue, getSessionValueOrDefault, setSessionValue} from "../../services/session"

export default [
  {
    method: "GET",
    path: "/prescriptionIds",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const comparePrescriptionIds: ComparePrescriptions = getSessionValueOrDefault("compare_prescription_ids", request, {
        prescriptionId1: "",
        prescriptionId2: ""
      })
      const editPrescriptionsIds: Array<string> = getSessionValueOrDefault("sent_prescription_ids", request, [])
      const sentPrescriptionIds: Array<string> = getSessionValueOrDefault("sent_prescription_ids", request, [])
      const releasedPrescriptionIds: Array<string> = getSessionValueOrDefault("released_prescription_ids", request, [])
      const dispensedPrescriptionIds: Array<string> = getSessionValueOrDefault("dispensed_prescription_ids", request, [])
      const claimedPrescriptionIds: Array<string> = getSessionValueOrDefault("claimed_prescription_ids", request, [])

      return h.response({
        editingPrescriptions: editPrescriptionsIds,
        sentPrescriptions: sentPrescriptionIds,
        releasedPrescriptions: releasedPrescriptionIds,
        dispensedPrescriptions: dispensedPrescriptionIds,
        claimedPrescriptions: claimedPrescriptionIds,
        comparePrescriptions: comparePrescriptionIds
      }).code(200)
    }
  },
  {
    method: "GET",
    path: "/prescription/{prescriptionId}",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const shortPrescriptionId = request.params.prescriptionId
      setSessionValue("prescription_id", shortPrescriptionId, request)
      const bundle = getSessionValue(`prepare_request_${shortPrescriptionId}`, request)
      return h.response(bundle).code(200)
    }
  },
  {
    method: "GET",
    path: "/prescriptions",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const editingPrescriptionIds = getSessionValue("prescription_ids", request)
      const bundles = editingPrescriptionIds.map((id: string) =>
        getSessionValue(`prepare_request_${id}`, request)
      )
      return h.response(bundles).code(200)
    }
  },
  {
    method: "POST",
    path: "/compare-prescriptions",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prescriptionToAddToCompare = request.payload as {prescriptionId: string}
      const comparePrescriptions = getSessionValueOrDefault("compare_prescription_ids", request, {
        prescriptionId1: "",
        prescriptionId2: ""
      }) as ComparePrescriptions

      if (comparePrescriptions.prescriptionId1 && comparePrescriptions.prescriptionId2) {
        comparePrescriptions.prescriptionId1 = ""
        comparePrescriptions.prescriptionId2 = ""
      }

      if (!comparePrescriptions.prescriptionId1) {
        comparePrescriptions.prescriptionId1 = prescriptionToAddToCompare.prescriptionId
      } else if (!comparePrescriptions.prescriptionId2) {
        comparePrescriptions.prescriptionId2 = prescriptionToAddToCompare.prescriptionId
      }
      return h.response({}).code(200)
    }
  }
]

// todo: move
interface ComparePrescriptions {
  prescriptionId1: string
  prescriptionId2: string
}
