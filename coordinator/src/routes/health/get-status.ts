import Hapi from "@hapi/hapi"
import axios from "axios"
import {VALIDATOR_HOST} from "../util"

export default [
  {
    method: "GET",
    path: "/_status",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      let validator = false

      try {
        request.logger.info("Checking validator status")
        const response = await axios.get<string>(`${VALIDATOR_HOST}/_status`, {timeout: 2})

        if (response.status == 200 && response.data == "Validator is alive") {
          validator = true
        } else {
          const responseSummary = `Status: ${response.status}, data: ${response.data ?? "No Data"}`
          const msg = `Did not get positive response from validator status check. ${responseSummary}`
          request.logger.warn(msg)
        }
      } catch (err) {
        request.logger.error(`Got error when making request for validator status: ${err}`)
      }

      return h.response({
        coordinator: true,
        validator,
        commitId: process.env.COMMIT_ID
      })
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
