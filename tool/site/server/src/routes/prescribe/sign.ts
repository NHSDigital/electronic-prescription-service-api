import Hapi from "@hapi/hapi"
import {getMedicationRequests} from "../../common/getResources"
import {getSessionValue, setSessionValue} from "../../services/session"
import * as fhir from "fhir/r4"
import {CONFIG} from "../../config"

export default [
  {
    method: "GET",
    path: "/prescribe/sign",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prescriptionId = request.query["prescription_id"]
      const prescriptionIds = getSessionValue("prescription_ids", request)

      updatePagination(prescriptionIds, prescriptionId, responseToolkit)

      return responseToolkit.view("index", {baseUrl: CONFIG.baseUrl, environment: CONFIG.environment})
    }
  },
  {
    method: "POST",
    path: "/prescribe/sign",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prepareBundles = Array.from(request.payload as Array<fhir.Bundle>)
      const prescriptionIds: Array<string> = []

      if (!prepareBundles?.length) {
        return responseToolkit.response({}).code(400)
      }

      prepareBundles.forEach((prepareBundle: fhir.Bundle) => {
        const prescriptionId = getMedicationRequests(prepareBundle)[0].groupIdentifier?.value ?? ""
        if (prescriptionId) {
          prescriptionIds.push(prescriptionId)
          setSessionValue(`prepare_request_${prescriptionId}`, prepareBundle, request)
        }
      })

      setSessionValue("prescription_ids", prescriptionIds, request)
      const prescriptionId = prescriptionIds[0]
      setSessionValue("prescription_id", prescriptionId, request)

      updatePagination(prescriptionIds, prescriptionId, responseToolkit)

      return responseToolkit.response({
        redirectUri: `${CONFIG.baseUrl}prescribe/sign?prescription_id=${encodeURIComponent(prescriptionId)}`
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
