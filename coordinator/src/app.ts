import {Boom} from "@hapi/boom"
import Hapi from "@hapi/hapi"
import routes from "./routes"
import {toOperationOutcome, FhirMessageProcessingError} from "./models/errors/processing-errors"
import HapiPino from "hapi-pino"

const preResponse = function (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) {
  const response = request.response
  if (response instanceof Boom) {
    request.log("error", response)
  } else if (response instanceof FhirMessageProcessingError) {
    request.log("info", response)
    return responseToolkit.response(toOperationOutcome(response)).code(400)
  }
  return responseToolkit.continue
}

const init = async () => {
  const server = Hapi.server({
    port: 9000,
    host: "0.0.0.0",
    routes: {
      cors: true, // Won't run as Apigee hosted target without this
      payload: {
        parse: false
      }
    }
  })
  server.ext("onPreResponse", preResponse)

  server.route(routes)

  await server.register({
    plugin: HapiPino,
    options: {
      // For non-local environments, dont pretty print to avoid spamming logs
      prettyPrint: process.env.ENVIRONMENT_NAME === "local",
      // Redact Authorization headers, see https://getpino.io/#/docs/redaction
      redact: ["req.headers.authorization"]
    }
  })

  await server.start()
  server.log("info", `Server running on ${server.info.uri}`)
}

process.on("unhandledRejection", (err) => {
  console.log(err)
  process.exit(1)
})

init()
