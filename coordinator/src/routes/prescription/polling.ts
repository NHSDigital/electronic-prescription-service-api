import {Request} from "@hapi/hapi"
import Hapi from "@hapi/hapi"
import {requestHandler} from "../../services/handlers"
import {handleResponse} from "../util"

const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default [{
  method: "GET",
  path: "/_poll/{poll_path}",
  handler: async (request: Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const spineResponse = await requestHandler.poll(request.params.poll_path)
    const syncWrapTimeoutInSeconds = 30
    await sleep(syncWrapTimeoutInSeconds * 2 * 1000)
    return handleResponse(spineResponse, responseToolkit)
  }
}]
