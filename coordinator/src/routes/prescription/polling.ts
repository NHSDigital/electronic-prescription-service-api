import {Request} from "@hapi/hapi"
import Hapi from "@hapi/hapi"
import {requestHandler} from "../../services/handlers"
import {handleResponse} from "../util"

export default [{
  method: "GET",
  path: "/_poll/{poll_path}",
  handler: async (request: Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    console.log("request.path: " + request.path)
    console.log("request.params.poll_path:" + request.params.poll_path)
    const spineResponse = await requestHandler.poll(`/_poll/${request.params.poll_path}`, request.logger)
    return handleResponse(request, spineResponse, responseToolkit)
  }
}]
