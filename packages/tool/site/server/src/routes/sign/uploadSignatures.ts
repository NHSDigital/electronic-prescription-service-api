import Hapi from "@hapi/hapi"
import {getSigningClient} from "../../services/communication/signing-client"
import {getEpsClient} from "../../services/communication/eps-client"
import {getApigeeAccessTokenFromSession, getSessionValue, setSessionValue} from "../../services/session"
import * as fhir from "fhir/r4"
import {getSessionPrescriptionIdsArray} from "../util"

export default [
  {
    method: "POST",
    path: "/sign/upload-signatures",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const accessToken = getApigeeAccessTokenFromSession(request)
      const epsClient = getEpsClient(accessToken, request)
      const signingClient = getSigningClient(request, accessToken)
      const prescriptionIds = getSessionPrescriptionIdsArray(request)
      const successfulPreparePrescriptionIds = []
      const signingHeaders = request.headers["nhsd-identity-authentication-method"]
      for (const id of prescriptionIds) {
        const prepareRequest = getSessionValue(`prepare_request_${id}`, request)
        console.log(prepareRequest)
        const prepareResponse = await epsClient.makePrepareRequest(prepareRequest)
        setSessionValue(`prepare_response_${id}`, prepareResponse, request)
        if (!prepareResponseIsError(prepareResponse)) {
          successfulPreparePrescriptionIds.push(id)
        }
      }
      const prepareResponses = successfulPreparePrescriptionIds.map((id: string) => {
        return {
          id: id,
          response: getSessionValue(`prepare_response_${id}`, request),
          signingOptions: signingHeaders
        }
      })
      const response = await signingClient.uploadSignatureRequest(prepareResponses)
      return responseToolkit.response(response).code(200)

    }
  }
]

function prepareResponseIsError(prepareResponse: fhir.Parameters | fhir.OperationOutcome)
: prepareResponse is fhir.OperationOutcome {
  return !!(prepareResponse as fhir.OperationOutcome).issue?.length
}
