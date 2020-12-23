import Hapi from "@hapi/hapi"
import axios from "axios"
import {VALIDATOR_HOST} from "../util"

export default [
  {
    method: "GET",
    path: "/_status",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {

      try {
        const response = await axios.get<string>(`${VALIDATOR_HOST}/_status`, {timeout: 2})

        if (response.status != 200 || response.data != "Validator is alive") {
          request.logger.warn("Did not get positive response from validator status check")
          return h.response().code(400)
        }
      } catch (err) {
        request.logger.error(`Got error when making request for validator status: ${err}`)
        return h.response().code(400)
      }

      return h.response({
        message: "Coordinator is alive",
        commitId: process.env.COMMIT_ID
      })
    }
  }
]
