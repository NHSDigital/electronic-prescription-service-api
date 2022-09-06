import Hapi from "@hapi/hapi"
import * as fhir from "fhir/r4"
import {getMedicationRequests} from "../../common/getResources"
import {getEpsClient} from "../../services/communication/eps-client"
import {getApigeeAccessTokenFromSession, setSessionValue} from "../../services/session"

const isBundle = (resource: fhir.FhirResource): resource is fhir.Bundle => {
  return resource.resourceType === "Bundle"
}

const getPrescriptionIdFromBundle = (bundle: fhir.Bundle): string => {
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
      const fhirResponse = response.fhirResponse

      if (isBundle(fhirResponse)) {
        // Store the prescription in the session
        const prescriptionId = getPrescriptionIdFromBundle(fhirResponse)
        setSessionValue(`prescription_order_send_request_${prescriptionId}`, fhirResponse, request)
      }

      return h.response(fhirResponse).code(response.statusCode)
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
