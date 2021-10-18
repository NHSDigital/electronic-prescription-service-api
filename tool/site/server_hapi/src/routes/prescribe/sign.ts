import Hapi from "@hapi/hapi"
import {epsClient} from "../../services/communication/eps-client"
import {getSessionValue, setSessionValue} from "../../services/session"
import {preRequest} from "../util"

export default [
  {
    method: "POST",
    path: "/prescribe/sign",
    handler: preRequest(
      async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) => {
        const prescriptionIds = getSessionValue("prescription_ids", request)
        prescriptionIds.forEach(async(id: string) => {
          const prepareRequest = getSessionValue(`prepare_request_${id}`, request)
          const prepareResponse = await epsClient.makePrepareRequest(prepareRequest)
          setSessionValue(`prepare_response_${id}`, prepareResponse, request)
        })
        const basePathForRedirect =
          process.env.BASE_PATH === undefined
            ? "/"
            : `/${process.env.BASE_PATH}/`
        return responseToolkit.response({
          "redirectUri": `${basePathForRedirect}prescribe/send`
        }).code(200)
      }
    )
  }
]
