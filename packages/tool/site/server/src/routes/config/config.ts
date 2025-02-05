import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {setSessionValue} from "../../services/session"

export default {
  method: "POST" as RouteDefMethods,
  path: "/config",
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const payload = request.payload as {
      useSigningMock: boolean,
      epsPrNumber: string,
      signingPrNumber: string,
      useProxygen: boolean
    }
    setSessionValue("use_signing_mock", payload.useSigningMock, request)
    setSessionValue("eps_pr_number", payload.epsPrNumber, request)
    setSessionValue("signing_pr_number", payload.signingPrNumber, request)
    setSessionValue("use_proxygen", payload.useProxygen, request)
    return h.response({success: true}).code(200)
  }
}
