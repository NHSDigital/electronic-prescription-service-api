import Hapi from "@hapi/hapi"
import {getMedicationRequests} from "../../common/getResources"
import {getSessionValue, setSessionValue} from "../../services/session"

export default [
  {
    method: "POST",
    path: "/prescribe/edit",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prepareBundles = Array.from(request.payload as any[])
      const prescriptionIds: Array<string> = []
      prepareBundles.forEach((prepareBundle: any) => {
        const prescriptionId = getMedicationRequests(prepareBundle)[0].groupIdentifier?.value ?? ""
        if (prescriptionId) {
          prescriptionIds.push(prescriptionId)
          setSessionValue(`prepare_request_${prescriptionId}`, prepareBundle, request)
        }
      })
      setSessionValue("prescription_ids", prescriptionIds, request)
      const first_bundle = prepareBundles[0]
      const first_bundle_id = prescriptionIds[0]
      setSessionValue("prescription_id", first_bundle_id, request)
      return responseToolkit.response({
        "bundle": first_bundle,
        "errors": []
        // todo: make a $validate call against ?sandbox? for non-authed users to provide validation errors against test-pack/individual prescription
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
