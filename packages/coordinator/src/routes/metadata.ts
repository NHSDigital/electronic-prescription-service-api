import Hapi, {RouteDefMethods} from "@hapi/hapi"
import {getCapabilityStatement} from "../utils/metadata"

export default [{
  method: "GET" as RouteDefMethods,
  path: "/metadata",
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
    const capabilityStatement = getCapabilityStatement(request.logger, request.headers)
    if (capabilityStatement) {
      return h.response({
        capabilityStatement
      }).code(200)
    }
    return h.response().code(404)
  }
}]
