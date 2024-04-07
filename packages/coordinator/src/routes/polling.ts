import {Request, RouteDefMethods} from "@hapi/hapi"
import Hapi from "@hapi/hapi"
import {spineClient} from "../services/communication/spine-client"
import {handleResponse} from "./util"
import {getAsid} from "../utils/headers"

export default [{
  method: "GET" as RouteDefMethods,
  path: "/_poll/{poll_path}",
  handler: async (request: Request, responseToolkit: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const spineResponse = await spineClient.poll(
      request.params.poll_path,
      getAsid(request.headers),
      request.logger
    )
    return await handleResponse(request, spineResponse, responseToolkit)
  }
}]
