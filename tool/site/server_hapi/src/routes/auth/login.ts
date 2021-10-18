import Hapi from "@hapi/hapi"

export default [
  {
    method: "POST",
    path: "/login",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const loginInfo = getPayload(request) as any
      const access_token = loginInfo.access_token
      request.yar.set(`access_token`, access_token)
      return h.response({}).code(200)
    }
  },
  {
    method: "GET",
    path: "/login",
    handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Hapi.ResponseObject> => {
      const access_token = request.yar.get("access_token")
      return h.response(access_token).code(200)
    }
  }
]

function getPayload(request: Hapi.Request): unknown {
  request.logger.info("Parsing request payload")
  if (Buffer.isBuffer(request.payload)) {
    return JSON.parse(request.payload.toString())
  } else if (typeof request.payload === "string") {
    return JSON.parse(request.payload)
  } else {
    return {}
  }
}
