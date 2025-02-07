import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {
  appendToSessionValueWithoutDuplication,
  getApigeeAccessTokenFromSession,
  getSessionValue,
  removeFromSessionValue,
  setSessionValue
} from "../../services/session"
import {Claim} from "fhir/r4"
import {getEpsClient} from "../../services/communication/eps-client"
import {getCorrelationId} from "../util"

export default [
  {
    method: "POST" as RouteDefMethods,
    path: "/dispense/claim",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const payload = request.payload as {prescriptionId: string, claim: Claim}
      const prescriptionId = payload.prescriptionId
      const claimRequest = payload.claim
      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const correlationId = getCorrelationId(request)
      const claimResponse = await epsClient.makeClaimRequest(claimRequest, correlationId)
      const claimResponseHl7 = await epsClient.makeConvertRequest(claimRequest, correlationId)
      const success = claimResponse.statusCode === 200

      if (success) {
        setSessionValue(`claim_request_${prescriptionId}`, claimRequest, request)
        removeFromSessionValue("dispensed_prescription_ids", prescriptionId, request)
        appendToSessionValueWithoutDuplication("claimed_prescription_ids", prescriptionId, request)
      }

      return responseToolkit.response({
        success: success,
        request_xml: claimResponseHl7,
        request: claimRequest,
        response: claimResponse.fhirResponse,
        response_xml: claimResponse.spineResponse
      }).code(200)
    }
  },
  {
    method: "GET" as RouteDefMethods,
    path: "/claim/{prescriptionId}",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const prescriptionId = request.params.prescriptionId
      if (!prescriptionId) {
        return h.response("Prescription id required in path").code(400)
      }
      const key = `claim_request_${prescriptionId}`
      const claimRequest = getSessionValue(key, request)
      return h.response(claimRequest).code(200)
    }
  }
]
