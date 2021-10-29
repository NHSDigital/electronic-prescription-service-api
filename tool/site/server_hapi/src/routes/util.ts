import Hapi from "@hapi/hapi"

export function getPayload(request: Hapi.Request): unknown {
  request.logger.info("Parsing request payload")
  if (Buffer.isBuffer(request.payload)) {
    return JSON.parse(request.payload.toString())
  } else if (typeof request.payload === "string") {
    return JSON.parse(request.payload)
  } else {
    return {}
  }
}
