import Hapi from "@hapi/hapi"
import routes from "./routes"
import HapiPino from "hapi-pino"
import Yar from "@hapi/yar"
import CatboxRedis from "@hapi/catbox-redis"
import {isLocal} from "./services/environment"

const init = async () => {
  const server = Hapi.server({
    port: 9001,
    host: "0.0.0.0",
    routes: {
      cors: true, // Won't run as Apigee hosted target without this
      payload: {
        parse: false
      }
    },
    cache: [{
      name: "eps_api_tool_hapi",
      provider: {
        constructor: CatboxRedis,
        options: {
          host: process.env.REDIS_URL,
          port: process.env.REDIS_PORT
        }
      }
    }]
  })

  server.route(routes)

  await server.register({
    plugin: Yar,
    options: {
      storeBlank: false,
      // Use "0" maxCookieSize to force all session data to be written to cache
      maxCookieSize: 0,
      cache: {
        expiresIn: 24 * 60 * 60 * 1000
      },
      cookieOptions: {
        password: process.env.SESSION_TOKEN_ENCRYPTION_KEY ?? "",
        isSecure: true,
        isSameSite: "None"
      }
    }
  })

  await server.register({
    plugin: HapiPino,
    options: {
      // Pretty print in local environment only to avoid spamming logs
      prettyPrint: isLocal(),
      // Redact Authorization headers, see https://getpino.io/#/docs/redaction
      redact: ["req.headers.authorization"]
    }
  })

  await server.start()
  server.log("info", `Server running on ${server.info.uri}`)
}

process.on("unhandledRejection", err => {
  console.log(err)
  process.exit(1)
})

init()
