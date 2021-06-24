import Hapi from "@hapi/hapi"
import axios from "axios"
import {VALIDATOR_HOST} from "../util"

export interface StatusCheckResponse {
  status: "pass" | "warn" | "error"
  timeout: "false"
  responseCode: number
  outcome?: string
  links?: string
}

async function getValidatorHealth(): Promise<StatusCheckResponse> {
  try {
    const validatorResponse = await axios.get<string>(`${VALIDATOR_HOST}/_status`, {timeout: 20000})

    return {
      status: validatorResponse.status === 200 ? "pass" : "error",
      timeout: "false",
      responseCode: validatorResponse.status,
      outcome: validatorResponse.data
    }
  } catch {
    return {
      status: "error",
      timeout: "false",
      responseCode: 500
    }
  }
}

export default [
  {
    method: "GET",
    path: "/_status",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const checks: { [name: string]: Array<StatusCheckResponse> } = {
        "validator:status": [await getValidatorHealth()]
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
