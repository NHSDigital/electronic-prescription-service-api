import Hapi from "@hapi/hapi"
import axios from "axios"
import {VALIDATOR_HOST} from "../util"
import {spineClient} from "../../services/communication/spine-client"

export interface StatusCheckResponse {
  status: "pass" | "warn" | "error"
  timeout: "true" | "false"
  responseCode: number
  outcome?: string
  links?: string
}

export async function serviceHealthCheck(url: string): Promise<StatusCheckResponse> {
  return await axios
    .get<string>(url, {timeout: 20000})
    .then((response): StatusCheckResponse => ({
      status: response.status === 200 ? "pass" : "error",
      timeout: "false",
      responseCode: response.status,
      outcome: response.data,
      links: url
    }))
    .catch(error => ({
      status: "error",
      timeout: error.code === "ECONNABORTED" ? "true" : "false",
      responseCode: 500
    }))
}

export default [
  {
    method: "GET",
    path: "/_status",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const checks: { [name: string]: Array<StatusCheckResponse> } = {
        "validator:status": [await serviceHealthCheck(`${VALIDATOR_HOST}/_status`)],
        "spine:status": [await spineClient.getStatus()]
      }

      let responseStatus = "pass"
      let responseCode = 200
      const warnFilter = Object.values(checks).flat().filter(response => response.status === "warn")
      if (warnFilter.length > 0) {
        responseStatus = "warn"
        responseCode = 500
      }
      const errorFilter = Object.values(checks).flat().filter(response => response.status === "error")
      if (errorFilter.length > 0) {
        responseStatus = "error"
        responseCode = 500
      }

      return h.response({
        status: responseStatus,
        commitId: process.env.COMMIT_ID,
        checks: checks
      }).code(responseCode)
    }
  },
  {
    method: "GET",
    path: "/_validatormetrics/{path*}",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      try {
        const url = `${VALIDATOR_HOST}/actuator/metrics/${request.params.path ?? ""}${request.url.search ?? ""}`
        request.logger.info(`Getting validator metrics at ${url}`)

        const response = await axios.get<string>(url, {timeout: 2000})

        if (response.status < 400) {
          return h.response(response.data)
        } else {
          return h.response("Could not get metrics")
        }
      } catch (err) {
        request.logger.error(`Got error when making request for validator metrics: ${err}`)
      }
    }
  }
]
