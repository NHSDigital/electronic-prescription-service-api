import Hapi from "@hapi/hapi"
import {getSigningClient} from "../../services/communication/signing-client"
import {getEpsClient} from "../../services/communication/eps-client"
import {getSessionValue, setSessionValue} from "../../services/session"
import {Parameters, OperationOutcome} from "fhir/r4"

export default [
  {
    method: "POST",
    path: "/prescribe/sign",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const accessToken = getSessionValue("access_token", request)
      const authMethod = getSessionValue("auth_method", request)
      const epsClient = getEpsClient(accessToken)
      const signingClient = getSigningClient(request, accessToken, authMethod)
      const prescriptionIds = getSessionValue("prescription_ids", request)
      for (const id of prescriptionIds) {
        const prepareRequest = getSessionValue(`prepare_request_${id}`, request)
        const prepareResponse = await epsClient.makePrepareRequest(prepareRequest)
        // return first error, and set current prescription id as a hook to show the prescription
        // with errors in the ui even when there are multiple prescriptions in session
        if (prepareResponseIsError(prepareResponse)) {
          setSessionValue(`prescription_id`, id, request)
          return responseToolkit.response({prepareErrors: [prepareResponse]}).code(200)
        }
        else {
          setSessionValue(`prepare_response_${id}`, prepareResponse, request)
        }
      }
      const prepareResponses = prescriptionIds.map((id: string) => getSessionValue(`prepare_response_${id}`, request))
      const response = await signingClient.uploadSignatureRequest(prepareResponses)
      return responseToolkit.response(response).code(200)
    }
  }
]

function prepareResponseIsError(prepareResponse: Parameters | OperationOutcome): prepareResponse is OperationOutcome {
  return prepareResponse as OperationOutcome !== undefined
}
