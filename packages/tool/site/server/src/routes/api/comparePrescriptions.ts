import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {getSessionValue, getSessionValueOrDefault, setSessionValue} from "../../services/session"

export default [
  {
    method: "GET" as RouteDefMethods,
    path: "/api/compare-prescriptions",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const comparePrescriptions = getSessionValueOrDefault("compare_prescriptions", request, {
        prescription1Key: "",
        prescription1: "",
        prescription2Key: "",
        prescription2: ""
      })
      return h.response(comparePrescriptions).code(200)
    }
  },
  {
    method: "POST" as RouteDefMethods,
    path: "/api/compare-prescriptions",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const comparePrescriptionsRequest = request.payload as {name: string, id: string}
      const comparePrescriptions = getSessionValueOrDefault("compare_prescriptions", request, {
        prescription1Key: "",
        prescription1: "",
        prescription2Key: "",
        prescription2: ""
      })
      if (!comparePrescriptions.prescription1) {
        comparePrescriptions.prescription1Key =
          `${comparePrescriptionsRequest.name}_${comparePrescriptionsRequest.id}`
        comparePrescriptions.prescription1 = getPrescription(
          comparePrescriptionsRequest.name,
          comparePrescriptionsRequest.id,
          request
        )
      } else if (!comparePrescriptions.prescription2) {
        comparePrescriptions.prescription2Key =
        `${comparePrescriptionsRequest.name}_${comparePrescriptionsRequest.id}`
        comparePrescriptions.prescription2 = getPrescription(
          comparePrescriptionsRequest.name,
          comparePrescriptionsRequest.id,
          request
        )
      }
      setSessionValue("compare_prescriptions", comparePrescriptions, request)
      return h.response(comparePrescriptions).code(200)
    }
  },
  {
    method: "POST" as RouteDefMethods,
    path: "/api/reset-compare-prescriptions",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      setSessionValue("compare_prescriptions", {prescription1:"", prescription2:""}, request)
      return h.response({}).code(200)
    }
  },
  {
    method: "POST" as RouteDefMethods,
    path: "/api/remove-compare-prescription",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prescriptionToRemove = request.payload as {name: string, id: string}
      const key = `${prescriptionToRemove.name}_${prescriptionToRemove.id}`
      const comparePrescriptions = getSessionValue("compare_prescriptions", request)
      if (comparePrescriptions.prescription1Key === key) {
        comparePrescriptions.prescription1 = ""
      } else if (comparePrescriptions.prescription2Key === key) {
        comparePrescriptions.prescription2 = ""
      }
      setSessionValue("compare_prescriptions", {prescription1:"", prescription2:""}, request)
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
