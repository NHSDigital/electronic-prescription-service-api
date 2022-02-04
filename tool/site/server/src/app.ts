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

  const server = createServer()

  await registerAuthentication(server)
  await registerSession(server)
  await registerLogging(server)
  await registerStaticRouteHandlers(server)
  await registerViewRouteHandlers(server)

  addStaticRoutes(server)
  addApiRoutes(server)
  addViewRoutes(server)

  await server.start()
  server.log("info", `Server running on ${server.info.uri}`)
}

process.on("unhandledRejection", err => {
  console.log(err)
  process.exit(1)
})

function createServer() {
  return Hapi.server({
    port: 9000,
    host: "0.0.0.0",
    routes: {
      cors: true
    }
  })
}

async function registerAuthentication(server: Hapi.Server) {
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
}

async function registerSession(server: Hapi.Server) {
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
}

async function registerLogging(server: Hapi.Server) {
  await server.register({
    plugin: HapiPino,
    options: {
      // Pretty print in local environment only to avoid spamming logs
      prettyPrint: isLocal(),
      // Redact Authorization headers, see https://getpino.io/#/docs/redaction
      redact: ["req.headers.authorization"]
    }
  })
}

async function registerStaticRouteHandlers(server: Hapi.Server) {
  await server.register(inert)
}

async function registerViewRouteHandlers(server: Hapi.Server) {
  await server.register(Vision)
}


function addStaticRoutes(server: Hapi.Server) {
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
}

function addApiRoutes(server: Hapi.Server) {
  server.route(routes)
}

function addViewRoutes(server: Hapi.Server) {
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
}

init()
