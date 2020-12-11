import {Request} from "@hapi/hapi"
import Hapi from "@hapi/hapi"
import {requestHandler} from "../../services/handlers"
import {handleResponse} from "../util"

export default [{
  method: "GET",
  path: "/_poll/{poll_path}",
  handler: async (request: Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const spineResponse = await requestHandler.poll(request.params.poll_path, request.log)
    return handleResponse(spineResponse, responseToolkit)
  }
}]
