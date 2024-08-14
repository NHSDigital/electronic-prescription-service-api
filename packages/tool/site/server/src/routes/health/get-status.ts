import Hapi, {RouteDefMethods, RouteOptions} from "@hapi/hapi"
import {getEpsClient} from "../../services/communication/eps-client"
import {CONFIG} from "../../config"
import {getSigningClient} from "../../services/communication/signing-client"

function createStatusResponse(
  errorStatusCode: number,
  checks: Record<string, Array<StatusCheckResponse>>,
  h: Hapi.ResponseToolkit
) {
  let responseStatus = "pass"
  let responseCode = 200
  const allChecks = Object.values(checks).flat()
  if (allChecks.find(check => check.status === "warn")) {
    responseStatus = "warn"
    responseCode = errorStatusCode
  }
  if (allChecks.find(check => check.status === "error")) {
    responseStatus = "error"
    responseCode = errorStatusCode
  }

  return h.response({
    status: responseStatus,
    commitId: CONFIG.commitId,
    checks: checks
  }).code(responseCode)
}

export default [
  {
    method: "GET" as RouteDefMethods,
    path: "/_status",
    options: {
      auth: false
    } satisfies RouteOptions,
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      return createStatusResponse(200, {
        // todo
      }, h)
    }
  },
  {
    method: "GET" as RouteDefMethods,
    path: "/_healthcheck",
    options: {
      auth: false
    } satisfies RouteOptions,
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const epsClient = getEpsClient("", request)
      const signingClient = getSigningClient(request, "")
      const epsVersion = (await epsClient.makePingRequest()).version
      const signingVersion = (await signingClient.makePingRequest()).version
      const validatorVersion = CONFIG.validatorVersion

      return createStatusResponse(500, {
        "eps": [{status: "pass", timeout: "false", responseCode: 200, version: epsVersion}],
        "signing-service": [{status: "pass", timeout: "false", responseCode: 200, version: signingVersion}],
        "validator": [{status: "pass", timeout: "false", responseCode: 200, version: validatorVersion}]
      }, h)
    }
  }
]

export interface Ping {
  version: string
  revision: string
  releaseId: string
  commitId: string
}

interface StatusCheckResponse {
  status: "pass" | "warn" | "error"
  timeout: "true" | "false"
  responseCode: number
  version: string
  outcome?: string
  links?: string
}
