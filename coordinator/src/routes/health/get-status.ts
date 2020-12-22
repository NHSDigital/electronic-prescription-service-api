import Hapi from "@hapi/hapi"
import Axios from "axios"

export default [
  {
    method: "GET",
    path: "/_status",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const response = await Axios.get<string>("http://localhost:9001/_status", {timeout: 2})

      if (response.status != 200 || response.data != "Validator is alive") {
        request.logger.warn("Did not get positive response from validator status check")
        return h.response().code(400)
      }

      return h.response({
        message: "Coordinator is alive",
        commitId: process.env.COMMIT_ID
      })
    }
  }
]
