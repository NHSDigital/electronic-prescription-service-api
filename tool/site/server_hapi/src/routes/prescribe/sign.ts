import Hapi from "@hapi/hapi"
import {getSigningClient} from "../../services/communication/signing-client"
import {getEpsClient} from "../../services/communication/eps-client"
import {getSessionValue, setSessionValue} from "../../services/session"

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
        // todo: return prepareErrors (see client/index.ts sendSignRequest for expected format)
        const prepareResponse = await epsClient.makePrepareRequest(prepareRequest)
        setSessionValue(`prepare_response_${id}`, prepareResponse, request)
      }
      const prepareResponses = prescriptionIds.map((id: string) => getSessionValue(`prepare_response_${id}`, request))
      const response = await signingClient.uploadSignatureRequest(prepareResponses)
      return responseToolkit.response(response).code(200)
    }
  }
]
