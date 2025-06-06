import Hapi from "@hapi/hapi"
import routes from "./routes"
import HapiPino from "hapi-pino"
import {isLocal} from "./utils/environment"
import {
  reformatUserErrorsToFhir,
  rejectInvalidProdHeaders,
  switchContentTypeForSmokeTest
} from "./utils/server-extensions"

export const createServer = (
  {collectLogs}: {collectLogs?: boolean},
  port: number
): Hapi.Server => {
  const server = Hapi.server({
    port: port,
    host: "0.0.0.0",
    routes: {
      cors: true, // Won't run as Apigee hosted target without this
      payload: {
        parse: false
      }
    }
  })

  if (collectLogs) {
    routes.forEach((route) => {
      route.options = {
        log: {
          collect: true
        }
      }
    })
  }

  server.route(routes)

  server.ext([
    {type: "onRequest", method: rejectInvalidProdHeaders},
    {type: "onPreResponse", method: reformatUserErrorsToFhir},
    {type: "onPreResponse", method: switchContentTypeForSmokeTest}
  ])

  return server
}

const configureLogging = async (server: Hapi.Server) => {
  return await HapiPino.register(server, {
    // For non-local environments, dont pretty print to avoid spamming logs
    ...(isLocal() && {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          minimumLevel: process.env.LOG_LEVEL || "info",
          levelFirst: true,
          messageFormat: true,
          timestampKey: "time",
          translateTime: true,
          singleLine: false,
          mkdir: true,
          append: true
        }
      }
    }),
    // Redact Authorization headers, see https://getpino.io/#/docs/redaction
    redact: ["req.headers.authorization", "req.headers['x-amzn-mtls-clientcert-leaf']"],
    wrapSerializers: false
  })
}

export const init = async (): Promise<void> => {
  const server = createServer({}, 9000)
  // need to set the keep alive timeout higher than the ALB idle timeout to avoid 502 errors
  server.listener.keepAliveTimeout = 65000
  await configureLogging(server)
  await server.start()
  server.log("info", `Server running on ${server.info.uri}`)

  // handle shutdown gracefully
  // note - we use console.log here rather than server.log as the server may not be available
  process.on("SIGTERM", async () => {
    const serverStopTimeout: number = 5
    console.log(`Gracefully stopping server with a timeout of ${serverStopTimeout} seconds`)
    await server.stop({timeout: serverStopTimeout * 1000})
    console.log("Server stopped")
    process.exit(0)
  })
}
