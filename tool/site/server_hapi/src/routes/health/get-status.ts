import Hapi from "@hapi/hapi"
import axios from "axios"

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
    commitId: process.env.COMMIT_ID,
    checks: checks
  }).code(responseCode)
}

export default [
  {
    method: "GET",
    path: "/_status",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      
      const apiUrl = process.env.PUBLIC_APIGEE_URL
      
      const epsUrl = `${apiUrl}/${process.env.BASE_PATH?.replace("eps-api-tool", "electronic-prescriptions")}/_ping`
      const signingServiceUrl = `${apiUrl}/signing-service/_ping`

      const epsVersion = (await axios.get<Ping>(epsUrl)).data.version
      const signingVersion = (await axios.get<Ping>(signingServiceUrl)).data.version

      return createStatusResponse(200, {
        "eps": [{status: "pass", timeout: "false", responseCode: 200, version: epsVersion}],
        "signing-service": [{status: "pass", timeout: "false", responseCode: 200, version: signingVersion}],
        "validator": [{status: "pass", timeout: "false", responseCode: 200, version: "v1.0.74-alpha"}]
      }, h)
    }
  },
  {
    method: "GET",
    path: "/_healthcheck",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      return createStatusResponse(500, {
        // todo
      }, h)
    }
  }
]

interface Ping {
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
