// Typescript allows compilation using path aliases but does not support runtime
// See: https://github.com/microsoft/TypeScript/issues/10866
// this package allows adding aliases at runtime to accomplish the same thing
// that paths in tsconfig.json allows at compile time
// aliases are added to package.json and the below ensures it is always relative
// to this entrypoint
import {default as moduleAlias} from "module-alias"
moduleAlias(__dirname + "/../../package.json")
// *****************************************************************************

import Hapi from "@hapi/hapi"
import routes from "./routes"
import HapiPino from "hapi-pino"
import {isLocal} from "./services/environment"
import {reformatUserErrorsToFhir, rejectInvalidProdHeaders, switchContentTypeForSmokeTest} from "./server-extensions"

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
  server.ext([
    {type: "onRequest", method: rejectInvalidProdHeaders},
    {type: "onPreResponse", method: reformatUserErrorsToFhir},
    {type: "onPreResponse", method: switchContentTypeForSmokeTest}
  ])

  server.route(routes)

  await server.register({
    plugin: HapiPino,
    options: {
      // For non-local environments, dont pretty print to avoid spamming logs
      prettyPrint: isLocal(),
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
