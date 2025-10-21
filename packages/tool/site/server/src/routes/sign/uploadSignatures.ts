import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {getSigningClient} from "../../services/communication/signing-client"
import {getEpsClient} from "../../services/communication/eps-client"
import {getApigeeAccessTokenFromSession, getSessionValue, setSessionValue} from "../../services/session"
import * as fhir from "fhir/r4"
import {getCorrelationId, getSessionPrescriptionIdsArray} from "../util"
import {AxiosResponse} from "axios"

export default [
  {
    method: "POST" as RouteDefMethods,
    path: "/sign/upload-signatures",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const accessToken = getApigeeAccessTokenFromSession(request)
      const selectedRole = getSessionValue("Selected-Role", request) as string | undefined
      const epsClient = getEpsClient(accessToken, request)
      const signingClient = getSigningClient(request, accessToken)
      const prescriptionIds = getSessionPrescriptionIdsArray(request)
      const successfulPreparePrescriptionIds = []
      const correlationId = getCorrelationId(request)
      for (const id of prescriptionIds) {
        const prepareRequest = getSessionValue(`prepare_request_${id}`, request)
        const prepareResponse = await epsClient.makePrepareRequest(prepareRequest, correlationId, selectedRole)
        setSessionValue(`prepare_response_${id}`, prepareResponse, request)
        if (prepareResponseIsError(prepareResponse)) {
          const error = prepareResponse as unknown as AxiosResponse

          request.logger.error({
            message: `Prepare request failed for prescription id`,
            prescriptionId: id,
            response_status: error.status,
            response_data: error.data,
            correlationId
          })
          continue
        }

        successfulPreparePrescriptionIds.push(id)
      }

      if (successfulPreparePrescriptionIds.length === 0) {
        request.logger.error({
          message: "No successful prepare responses, cannot proceed to upload signatures",
          correlationId
        })
        return responseToolkit.response().code(400)
      }

      const prepareResponses = successfulPreparePrescriptionIds.map((id: string) => {
        return {
          id: id,
          response: getSessionValue(`prepare_response_${id}`, request)
        }
      })
      const response = await signingClient.uploadSignatureRequest(prepareResponses, correlationId)
      return responseToolkit.response(response).code(200)

    }
  }
]

function prepareResponseIsError(prepareResponse: fhir.Parameters | fhir.OperationOutcome)
: prepareResponse is fhir.OperationOutcome {
  return !!(prepareResponse as fhir.OperationOutcome).issue?.length
}
