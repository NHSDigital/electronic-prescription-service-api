import Hapi from "@hapi/hapi"
import routes from "./routes"
import HapiPino from "hapi-pino"
import Vision from "@hapi/vision"
import * as inert from "@hapi/inert"
import Yar from "@hapi/yar"
import Cookie from "@hapi/cookie"
import {isDev, isLocal} from "./services/environment"
import axios from "axios"
import {setSessionValue} from "./services/session"
import {CONFIG} from "./config"

const init = async () => {
  axios.defaults.validateStatus = () => true

  const server = Hapi.server({
    port: 9000,
    host: "0.0.0.0",
    routes: {
      cors: true // Won't run as Apigee hosted target without this
    }
  })

  await server.register(Cookie)
  server.auth.strategy("session", "cookie", {
    cookie: {
      name: "auth",
      password: CONFIG.sessionKey,
      isSecure: true
    },
    redirectTo: (request: Hapi.Request) => {
      if (isDev()) {
        setSessionValue(
          "use_signing_mock",
          request.query["use_signing_mock"],
          request
        )
      }
      return `${CONFIG.baseUrl}login`
    }
  })
  server.auth.default("session")

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
        password: CONFIG.sessionKey,
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

  await server.register(inert)

  server.route({
    method: "GET",
    path: `/static/{param*}`,
    options: {
      auth: false
    },
    handler: {
      directory: {
        path: "static"
      }
    }
  })

  await server.register(Vision)

  server.views({
    engines: {
      html: require("handlebars")
    },
    relativeTo: __dirname,
    path: "templates"
  })

  server.route(addHomeViewRoute())
  server.route(addViewRoute("login", true))
  server.route(addViewRoute("my-prescriptions"))
  server.route(addViewRoute("validate"))
  server.route(addViewRoute("search"))
  server.route(addViewRoute("prescribe/load"))
  server.route(addViewRoute("prescribe/send"))
  server.route(addViewRoute("prescribe/cancel"))
  server.route(addViewRoute("dispense/release"))
  server.route(addViewRoute("dispense/return"))
  server.route(addViewRoute("dispense/dispense"))
  server.route(addViewRoute("dispense/withdraw"))
  server.route(addViewRoute("dispense/claim"))

  function addHomeViewRoute() : Hapi.ServerRoute {
    return {
      method: "GET",
      path: `/`,
      handler: {
        view: {
          template: "index",
          context: {
            baseUrl: CONFIG.baseUrl,
            environment: CONFIG.environment
          }
        }
      }
    }
  }

  function addViewRoute(path: string, skipAuth?: boolean): Hapi.ServerRoute {
    const viewRoute = {
      method: "GET",
      path: `/${path}`,
      handler: {
        view: {
          template: "index",
          context: {
            baseUrl: CONFIG.baseUrl,
            environment: CONFIG.environment
          }
        }
      }
    }

    if (skipAuth) {
      return {
        ...viewRoute,
        options: {
          auth: false
        }
      }
    }

    return viewRoute
  }

  await server.start()
  server.log("info", `Server running on ${server.info.uri}`)
}

process.on("unhandledRejection", err => {
  console.log(err)
  process.exit(1)
})

init()
