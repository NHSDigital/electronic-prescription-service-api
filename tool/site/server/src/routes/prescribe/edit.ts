import Hapi from "@hapi/hapi"
import {getMedicationRequests} from "../../common/getResources"
import {getSessionValue, setSessionValue} from "../../services/session"
import * as fhir from "fhir/r4"

export default [
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
      const first_bundle_id = prescriptionIds[0]
      setSessionValue("prescription_id", first_bundle_id, request)

      const baseUrl = process.env.BASE_PATH ? `/${process.env.BASE_PATH}/` : "/"

      return responseToolkit.response({
        redirectUri: `${baseUrl}prescribe/edit?prescription_id=${first_bundle_id}`
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
