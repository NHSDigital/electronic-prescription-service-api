import {Boom} from "@hapi/boom"
import Hapi from "@hapi/hapi"
import routes from "./routes"
import {FhirMessageProcessingError, toOperationOutcome} from "./models/errors/processing-errors"
import HapiPino from "hapi-pino"

export const CONTENT_TYPE_XML = "application/xml"
export const CONTENT_TYPE_PLAIN_TEXT = "text/plain"
export const CONTENT_TYPE_FHIR = "application/fhir+json; fhirVersion=4.0"
export const CONTENT_TYPE_JSON = "application/json"

const reformatUserErrorsToFhir = function (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) {
  const response = request.response
  if (response instanceof FhirMessageProcessingError) {
    request.log("info", response)
    return responseToolkit.response(toOperationOutcome(response)).code(400).type(CONTENT_TYPE_FHIR)
  } else if (response instanceof Boom) {
    request.log("error", response)
  }
  return responseToolkit.continue
}

const switchContentTypeForSmokeTest = function (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) {
  const isSmokeTest = request.headers["x-smoke-test"]
  if (!isSmokeTest) {
    return responseToolkit.continue
  }

  const response = request.response
  if (response instanceof Boom) {
    return responseToolkit.continue
  }

  const contentType = response.headers["content-type"]
  if (contentType === CONTENT_TYPE_FHIR) {
    response.type(CONTENT_TYPE_JSON)
  } else if (contentType === CONTENT_TYPE_XML) {
    response.type(CONTENT_TYPE_PLAIN_TEXT)
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
  server.ext("onPreResponse", reformatUserErrorsToFhir)
  server.ext("onPreResponse", switchContentTypeForSmokeTest)

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
