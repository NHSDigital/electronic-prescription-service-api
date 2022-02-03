import Hapi from "@hapi/hapi"
import {getMedicationRequests} from "../../common/getResources"
import {getSessionValue, setSessionValue} from "../../services/session"
import * as fhir from "fhir/r4"

export default [
  {
    method: "GET",
    path: "/prescribe/edit",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const baseUrl = process.env.BASE_PATH
      ? `/${process.env.BASE_PATH}/`
      : "/"

      const prescriptionId = request.query["prescription_id"]
      const prescriptionIds = getSessionValue("prescription_ids", request)

      updatePagination(prescriptionIds, prescriptionId, responseToolkit)

      return responseToolkit.view("index", { baseUrl, enviornment: process.env.ENVIRONMENT })
    }
  },
  {
    method: "POST",
    path: "/prescribe/edit",
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

      const baseUrl = process.env.BASE_PATH ? `/${process.env.BASE_PATH}/` : "/"

      updatePagination(prescriptionIds, prescriptionId, responseToolkit)

      return responseToolkit.response({
        redirectUri: encodeURI(`${baseUrl}prescribe/edit?prescription_id=${prescriptionId}`)
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
  }
]

function updatePagination(prescriptionIds: string[], prescriptionId: string, responseToolkit: Hapi.ResponseToolkit) {
  const previousPrescriptionIdIndex = prescriptionIds.indexOf(prescriptionId) - 1
  if (previousPrescriptionIdIndex >= 0) {
    const previousPrescriptionId = prescriptionIds[previousPrescriptionIdIndex]
    responseToolkit.state("Previous-Prescription-Id", previousPrescriptionId)
  }
  else {
    responseToolkit.state("Previous-Prescription-Id", "", {ttl: 0})
  }

  const nextPrescriptionIdIndex = prescriptionIds.indexOf(prescriptionId) + 1
  if (nextPrescriptionIdIndex >= 0) {
    const nextPrescriptionId = prescriptionIds[nextPrescriptionIdIndex]
    responseToolkit.state("Next-Prescription-Id", nextPrescriptionId)
  }
  else {
    responseToolkit.state("Next-Prescription-Id", "", {ttl: 0})
  }
  
  responseToolkit.state("Current-Prescription-Id", prescriptionId)
}