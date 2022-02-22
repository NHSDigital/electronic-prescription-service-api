import Hapi from "@hapi/hapi"
import {getSessionValue, getSessionValueOrDefault, setSessionValue} from "../../services/session"

export default [
  {
    method: "GET",
    path: "/prescriptionIds",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
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
        claimedPrescriptions: claimedPrescriptionIds
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
    method: "GET",
    path: "/api/compare-prescriptions",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const comparePrescriptions = getSessionValueOrDefault("compare_prescriptions", request, {
        prescription1: "",
        prescription2: ""
      })
      return h.response(comparePrescriptions).code(200)
    }
  },
  {
    method: "POST",
    path: "/api/compare-prescriptions",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const comparePrescriptionReuest = request.payload as {
        prescription1: {name: string, id: string}
        prescription2: {name: string, id: string}
      }

      const prescription1 = getPrescription(
        comparePrescriptionReuest.prescription1.name,
        comparePrescriptionReuest.prescription1.id,
        request
      )

      const prescription2 = getPrescription(
        comparePrescriptionReuest.prescription2.name,
        comparePrescriptionReuest.prescription2.id,
        request
      )

      const comparePrescriptions = {prescription1, prescription2}

      setSessionValue("compare_prescriptions", comparePrescriptions, request)

      return h.response({}).code(200)
    }
  }
]

function getPrescription(name: string, id: string, request: Hapi.Request) {
  let prescription = ""
  switch (name) {
    case "sent_prescriptions":
      prescription = getPrescriptionString(
        `prescription_order_send_request_${id}`, request
      )
      break
    case "released_prescriptions":
      prescription = getPrescriptionString(
        `release_response_${id}`, request
      )
      break
    case "dispensed_prescriptions":
      prescription = getPrescriptionString(
        `dispense_notification_requests_${id}`,
        request
      )
      break
    case "claimed_prescriptions":
      prescription = getPrescriptionString(
        `claim_request_${id}`,
        request)
      break
  }
  return prescription
}

function getPrescriptionString(
  key: string,
  request: Hapi.Request
): string {
  const result = getSessionValue(key, request)
  if (Array.isArray(result)) {
    return JSON.stringify(result.pop(), null, 2)
  }
  return JSON.stringify(result, null, 2)
}
