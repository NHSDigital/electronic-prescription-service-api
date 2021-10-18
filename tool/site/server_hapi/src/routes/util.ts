import Hapi from "@hapi/hapi"
import {epsClient, epsClientIsLive} from "../services/communication/eps-client"
import {getSessionValue} from "../services/session"

export function preRequest(handler: Hapi.Lifecycle.Method) {
  return async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.Lifecycle.ReturnValue> => {
    if (epsClientIsLive(epsClient)) {
      const accessToken = getSessionValue("access_token", request)
      epsClient.setAccessToken(accessToken)
    }
    return handler(request, responseToolkit)
  }
}
