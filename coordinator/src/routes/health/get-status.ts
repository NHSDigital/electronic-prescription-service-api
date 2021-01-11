import Hapi from "@hapi/hapi"
import axios from "axios"
import {VALIDATOR_HOST} from "../util"
async function checkValidatorStatus(request: Hapi.Request) {
  try {
    const response = await axios.get<string>(`${VALIDATOR_HOST}/_status`, {timeout: 2})

    if (response.status == 200 && response.data == "Validator is alive") {
      return true
    } else {
      const responseSummary = `Status: ${response.status}, data: ${response.data ?? "No Data"}`
      request.logger.warn(`Did not get positive response from validator status check. ${responseSummary}`)
    }
  } catch (err) {
    request.logger.error(`Got error when making request for validator status: ${err}`)
  }
  return false
}

export default [
  {
    method: "GET",
    path: "/_status",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const validator = await checkValidatorStatus(request)

      return h.response({
        coordinator: true,
        validator,
        commitId: process.env.COMMIT_ID
      })
    }
  }
]
