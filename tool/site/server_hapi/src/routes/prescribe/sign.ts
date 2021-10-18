import Hapi from "@hapi/hapi"
import {signingClient} from "../../services/communication/signing-client"
import {epsClient} from "../../services/communication/eps-client"
import {getSessionValue, setSessionValue} from "../../services/session"
import {preRequest} from "../util"
import {isLocal} from "../../services/environment"

export default [
  {
    method: "POST",
    path: "/prescribe/sign",
    handler: preRequest(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const prescriptionIds = getSessionValue("prescription_ids", request)
        const prepareResponses = prescriptionIds.map(async(id: string) => {
          const prepareRequest = getSessionValue(`prepare_request_${id}`, request)
          const prepareResponse = await epsClient.makePrepareRequest(prepareRequest)
          setSessionValue(`prepare_response_${id}`, prepareResponse, request)
          return prepareResponse
        })
        if (isLocal()) {
          return responseToolkit.response(getMockRedirect()).code(200)
        }
        const response = await signingClient.uploadSignatureRequest(prepareResponses)
        return responseToolkit.response(response).code(200)
      }
    )
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
