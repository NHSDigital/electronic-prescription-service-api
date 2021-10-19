import Hapi from "@hapi/hapi"
import {SigningClient} from "../../services/communication/signing-client"
import {epsClientIsLive, getEpsClient} from "../../services/communication/eps-client"
import {getSessionValue, getSessionValueOrDefault, setSessionValue} from "../../services/session"
import {isLocal} from "../../services/environment"

export default [
  {
    method: "POST",
    path: "/prescribe/sign",
    handler: async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const epsClient = getEpsClient(isLocal())
      const signingClient = new SigningClient()
      if (epsClientIsLive(epsClient)) {
        const accessToken = getSessionValue("access_token", request)
        const authMethod = getSessionValueOrDefault("auth_method", request, "simulated")
        epsClient.setAccessToken(accessToken)
        signingClient.setAuthMethod(authMethod)
        signingClient.setAccessToken(accessToken)
      }
      const prescriptionIds = getSessionValue("prescription_ids", request)
      for (const id of prescriptionIds) {
        const prepareRequest = getSessionValue(`prepare_request_${id}`, request)
        const prepareResponse = await epsClient.makePrepareRequest(prepareRequest)
        setSessionValue(`prepare_response_${id}`, prepareResponse, request)
        console.log("tttttttttttttttttttttt")
        console.log(JSON.stringify(prepareResponse))
      }
      const prepareResponses = prescriptionIds.map((id: string) => getSessionValue(`prepare_response_${id}`, request))
      console.log("vvvvvvvvvvvvvvvvvvvvvvvv")
      console.log(JSON.stringify(prepareResponses))
      if (isLocal()) {
        return responseToolkit.response(getMockRedirect()).code(200)
      }
      const response = await signingClient.uploadSignatureRequest(prepareResponses)
      return responseToolkit.response(response).code(200)
    }
  }
]

function getMockRedirect() {
  const basePathForRedirect = process.env.BASE_PATH === undefined
    ? "/"
    : `/${process.env.BASE_PATH}/`
  const response = {
    "redirectUri": `${basePathForRedirect}prescribe/send`
  }
  return response
}
