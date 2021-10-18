import Hapi from "@hapi/hapi"
import {signingClient} from "../services/communication/signing-client"
import {epsClient, epsClientIsLive} from "../services/communication/eps-client"
import {getSessionValue, getSessionValueOrDefault} from "../services/session"

export function preRequest(handler: Hapi.Lifecycle.Method) {
  return async (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.Lifecycle.ReturnValue> => {
    if (epsClientIsLive(epsClient)) {
      const accessToken = getSessionValue("access_token", request)
      const authMethod = getSessionValueOrDefault("auth_method", request, "simulated")
      epsClient.setAccessToken(accessToken)
      signingClient.setAuthMethod(authMethod)
      signingClient.setAccessToken(accessToken)
    }
    return handler(request, responseToolkit)
  }
}
