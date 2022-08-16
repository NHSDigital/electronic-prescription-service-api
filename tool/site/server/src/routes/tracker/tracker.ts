import Hapi from "@hapi/hapi"
import { Bundle } from "fhir/r4"
import { getMedicationRequests } from "../../common/getResources"
import {getEpsClient} from "../../services/communication/eps-client"
import {getApigeeAccessTokenFromSession, setSessionValue} from "../../services/session"

const getPrescriptionIdFromBundle = (bundle: Bundle): string => {
  return getMedicationRequests(bundle)[0].groupIdentifier?.value ?? ""
}

export default [
  {
    method: "GET",
    path: "/prescriptionTracker",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const response = await epsClient.makeGetPrescriptionTrackerRequest(request.query)

      if (response.statusCode === 200) {
        // TODO: use type guard
        const bundle = response.fhirResponse as Bundle
        const prescriptionId = getPrescriptionIdFromBundle(bundle)
        setSessionValue(`prescription_order_send_request_${prescriptionId}`, bundle, request)
      }
      
      return h.response(response.fhirResponse).code(response.statusCode)
    }
  },
  {
    method: "GET",
    path: "/taskTracker",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const response = await epsClient.makeGetTaskTrackerRequest(request.query)
      return h.response(response).code(200)
    }
  }
]
