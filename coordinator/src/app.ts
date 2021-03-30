// Typescript allows compilation using path aliases but does not support runtime
// See: https://github.com/microsoft/TypeScript/issues/10866
// this package allows adding aliases at runtime to accomplish the same thing
// that paths in tsconfig.json allows at compile time
// aliases are added to package.json and the below ensures it is always relative
// to this entrypoint
import {default as moduleAlias} from "module-alias"
moduleAlias(__dirname + "/../../package.json")
// *****************************************************************************

import {Boom} from "@hapi/boom"
import Hapi from "@hapi/hapi"
import routes from "./routes"
import {processingErrors as errors} from "@models"
import HapiPino from "hapi-pino"
import {CONTENT_TYPE_FHIR, CONTENT_TYPE_JSON, CONTENT_TYPE_PLAIN_TEXT, CONTENT_TYPE_XML} from "./routes/util"

function reformatUserErrorsToFhir(request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) {
  const response = request.response
  if (response instanceof errors.FhirMessageProcessingError) {
    request.log("info", response)
    return responseToolkit.response(errors.toOperationOutcome(response)).code(400).type(CONTENT_TYPE_FHIR)
  } else if (response instanceof Boom) {
    request.log("error", response)
  }
  return responseToolkit.continue
}

function switchContentTypeForSmokeTest(request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) {
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
