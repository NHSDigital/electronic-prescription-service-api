import * as Boom from "@hapi/boom"
import Hapi from "@hapi/hapi"
import routes from "./routes"
import {FhirMessageProcessingError, toOperationOutcome} from "./models/errors/processing-errors"
import HapiPino from "hapi-pino"

const preResponse = function (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) {
  const response = request.response
  if (response instanceof FhirMessageProcessingError) {
    request.log("info", response)
    return responseToolkit.response(toOperationOutcome(response)).code(400)
  } else if (response instanceof Boom.Boom) {
    request.log("error", response)
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
      },
      validate: {
        failAction: handleValidationError,
        options: {
          abortEarly: false
        }
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

export interface ValidationError extends Boom.Boom {
  output: Boom.Output & {
    payload: Boom.Payload & {
      validation: {
        source: string
        keys: Array<string>
      }
    }
  }
}

export const handleValidationError = (request: Hapi.Request, _: Hapi.ResponseToolkit, err?: Error): Boom.Boom => {
  if (!err) {
    request.log("error", "handleValidationError called without an Error")
    return Boom.internal()
  }
  // hapi deliberately doesn't return the full error to the client for security reasons,
  // log the full details to aid investigation, and return just the source and message
  request.log("error", err)
  const source = (err as ValidationError)?.output?.payload?.validation?.source
  const message = source ? `Invalid request ${source}: ${err.message}` : err.message
  return Boom.badRequest(message)
}

process.on("unhandledRejection", (err) => {
  console.log(err)
  process.exit(1)
})

init()
