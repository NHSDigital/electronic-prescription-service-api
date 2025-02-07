import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {getSessionValue, setSessionValue} from "../../services/session"

export default [
  {
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
  },
  {
    method: "GET" as RouteDefMethods,
    path: "/getconfig",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const useSigningMock = getSessionValue("use_signing_mock", request) as boolean
      const epsPrNumber = getSessionValue("eps_pr_number", request) as string
      const signingPrNumber = getSessionValue("signing_pr_number", request) as string
      const useProxygen = getSessionValue("use_proxygen", request) as boolean
      const response = {
        useSigningMock,
        epsPrNumber,
        signingPrNumber,
        useProxygen
      }
      return h.response(response).code(200)
    }
  }
]
