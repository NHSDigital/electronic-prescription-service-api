import Hapi from "@hapi/hapi"
import {setSessionValue} from "../../services/session"

export default {
  method: "POST",
  path: "/config",
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const payload = request.payload as {
      useSigningMock: boolean
      epsPrNumber: string
    }
    setSessionValue("use_signing_mock", payload.useSigningMock, request)
    setSessionValue("eps_pr_number", payload.epsPrNumber, request)
    return h.response({success: true}).code(200)
  }
}
