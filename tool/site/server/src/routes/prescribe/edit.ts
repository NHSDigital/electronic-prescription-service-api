import Hapi from "@hapi/hapi"
import {getMedicationRequests} from "../../common/getResources"
import {clearSessionValue, getSessionValue, getSessionValueOrDefault, setSessionValue} from "../../services/session"
import * as fhir from "fhir/r4"
import {CONFIG} from "../../config"

export default [
  {
    method: "GET",
    path: "/prescribe/edit",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prescriptionId = request.query["prescription_id"]
      const prescriptionIds = getSessionValue("prescription_ids", request).map((id: { prescriptionId: string }) => id.prescriptionId)

      updatePagination(prescriptionIds, prescriptionId, responseToolkit)

      return responseToolkit.view("index", {baseUrl: CONFIG.baseUrl, environment: CONFIG.environment})
    }
  },
  {
    method: "POST",
    path: "/prescribe/edit",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prepareBundles = Array.from(request.payload as Array<fhir.Bundle>)
      const sessionPrescriptionIds: Array<{bundleId: string | undefined, prescriptionId: string}> = getSessionValueOrDefault("prescription_ids", request, [])

      if (!prepareBundles?.length) {
        clearSessionValue("prescription_ids", request)
        clearSessionValue("prescription_id", request)
        return responseToolkit.response({}).code(200)
      }

      const requestPrescriptionIds: Array<{bundleId: string | undefined, prescriptionId: string}> = []

      prepareBundles.forEach((prepareBundle: fhir.Bundle) => {
        const prescriptionId = getMedicationRequests(prepareBundle)[0].groupIdentifier?.value ?? ""
        if (prescriptionId) {
          const prescription = {bundleId: prepareBundle.id, prescriptionId}
          const existingPrescriptionIndex = sessionPrescriptionIds.findIndex(sessionId => {
            return sessionId.bundleId === prescription.bundleId && sessionId.prescriptionId === prescription.prescriptionId
          })

          if (existingPrescriptionIndex === -1) {
            sessionPrescriptionIds.push(prescription)
          } else {
            sessionPrescriptionIds[existingPrescriptionIndex] = prescription
          }
          requestPrescriptionIds.push(prescription)
          setSessionValue(`prepare_request_${prescriptionId}`, prepareBundle, request)
        }
      })

      setSessionValue("prescription_ids", sessionPrescriptionIds, request)
      const prescriptionId = sessionPrescriptionIds[0].prescriptionId
      setSessionValue("prescription_id", prescriptionId, request)

      updatePagination(sessionPrescriptionIds.map(id => id.prescriptionId), prescriptionId, responseToolkit)

      let redirectUri = `${CONFIG.baseUrl}prescribe/edit`
      if (requestPrescriptionIds.length === 1) {
        redirectUri = `${redirectUri}?prescription_id=${requestPrescriptionIds[0].prescriptionId}`
      }

      return responseToolkit.response({
        redirectUri
      }).code(200)
    }
  }
]

function updatePagination(prescriptionIds: string[], prescriptionId: string, responseToolkit: Hapi.ResponseToolkit) {
  const previousPrescriptionIdIndex = prescriptionIds.indexOf(prescriptionId) - 1
  if (previousPrescriptionIdIndex >= 0) {
    const previousPrescriptionId = prescriptionIds[previousPrescriptionIdIndex]
    responseToolkit.state("Previous-Prescription-Id", previousPrescriptionId, {isHttpOnly: false})
  } else {
    responseToolkit.state("Previous-Prescription-Id", "", {ttl: 0, isHttpOnly: false})
  }

  const nextPrescriptionIdIndex = prescriptionIds.indexOf(prescriptionId) + 1
  if (nextPrescriptionIdIndex >= 0) {
    const nextPrescriptionId = prescriptionIds[nextPrescriptionIdIndex]
    responseToolkit.state("Next-Prescription-Id", nextPrescriptionId, {isHttpOnly: false})
  } else {
    responseToolkit.state("Next-Prescription-Id", "", {ttl: 0, isHttpOnly: false})
  }

  responseToolkit.state("Current-Prescription-Id", prescriptionId, {isHttpOnly: false})
}
