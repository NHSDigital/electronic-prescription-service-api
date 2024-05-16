import Hapi, {RouteDefMethods, RouteOptions} from "@hapi/hapi"
import routes from "./routes"
import HapiPino from "hapi-pino"
import Vision from "@hapi/vision"
import * as inert from "@hapi/inert"
import Yar from "@hapi/yar"
import Cookie from "@hapi/cookie"
import {
  isDev,
  isLocal,
  isQa,
  isSandbox
} from "./services/environment"
import axios from "axios"
import {CONFIG} from "./config"
import {getSessionValue} from "./services/session"
import * as XLSX from "xlsx"
import {
  getPrBranchUrl,
  parseOAuthState,
  prRedirectEnabled,
  prRedirectRequired
} from "./routes/helpers"

const init = async () => {
  axios.defaults.validateStatus = () => true

  const server = createServer()

  await registerAuthentication(server)
  await registerSession(server)
  await registerLogging(server)
  await registerStaticRouteHandlers(server)
  await registerViewRouteHandlers(server)

  addStaticRoutes(server)
  addDownloadRoutes(server)
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
    redirectTo: () => {
      const needsLogin = !(isSandbox(CONFIG.environment) || isLocal(CONFIG.environment))
      return needsLogin ? `${CONFIG.baseUrl}login` : `${CONFIG.baseUrl}callback`
    }
  })
  server.auth.default("session")
}

async function registerSession(server: Hapi.Server) {
  await server.register({
    plugin: Yar,
    options: {
      storeBlank: true,
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
  await HapiPino.register(server, {
    // For non-local environments, don't pretty print to avoid spamming logs
    ...(isLocal(CONFIG.environment) && {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          minimumLevel: "info",
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
    redact: ["req.headers.authorization"],
    wrapSerializers: false
  })
}

async function registerStaticRouteHandlers(server: Hapi.Server) {
  await server.register(inert)
}

async function registerViewRouteHandlers(server: Hapi.Server) {
  await server.register(Vision)
  server.views({
    engines: {
      html: require("handlebars")
    },
    relativeTo: __dirname,
    path: "templates"
  })
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

function addDownloadRoutes(server: Hapi.Server) {
  server.route({
    method: "GET",
    path: "/download/exception-report",
    handler: downloadExceptionReport
  })

  function downloadExceptionReport(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const exceptions = getSessionValue("exception_report", request)
    const fileName = "exception-report"
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(exceptions)
    XLSX.utils.book_append_sheet(wb, ws, "Test Exception Report")

    return h
      .response(XLSX.write(wb, {type: "binary"}))
      .type("application/vnd.ms-excel")
      .header("content-disposition", `attachment; filename=${fileName}.xlsx;`)
      .encoding("binary")
      .code(200)
  }
}

function addApiRoutes(server: Hapi.Server) {
  server.route(routes)
}

function addViewRoutes(server: Hapi.Server) {
  server.route(addHomeView())

  if (isSandbox(CONFIG.environment)) {
    server.route(addView("dose-to-text"))
  } else {
    server.route(addView("login", true))
    server.route(addView("my-prescriptions"))
    server.route(addView("validate"))
    server.route(addView("compare-prescriptions"))
    server.route(addView("search"))
    server.route(addView("view"))
    server.route(addView("tracker"))
    server.route(addView("prescribe/load"))
    server.route(addView("prescribe/edit"))
    server.route(addView("prescribe/send", true, true))
    server.route(addView("prescribe/cancel"))
    server.route(addView("dispense/release"))
    server.route(addView("dispense/verify"))
    server.route(addView("dispense/return"))
    server.route(addView("dispense/dispense"))
    server.route(addView("dispense/withdraw"))
    server.route(addView("dispense/claim"))
  }

  if (isLocal(CONFIG.environment)) {
    server.route(addView("dose-to-text"))
  }

  if (isDev(CONFIG.environment) || isLocal(CONFIG.environment) || isQa(CONFIG.environment)) {
    server.route(addView("config"))
  }

  function addHomeView(): Hapi.ServerRoute {
    return addView("/")
  }

  function addView(path: string, skipAuth?: boolean, prRedirect?: boolean): Hapi.ServerRoute {

    const viewRoute = {
      method: "GET" as RouteDefMethods,
      path: path.startsWith("/") ? path : `/${path}`,
      handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
        const test = h
        if (prRedirect) {
          // const parsedRequest = request.payload as {signatureToken: string, state?: string}
          console.log("pr redirect for path :" + path)
          console.log("request query: ")
          console.dir(request.query)
          const anothertest = request.query.state ? true : false
          console.log("is there a  state? " + anothertest)
          if(request.query.state) {
            console.log(`state: ${request.query.state as string}`)
            const state = parseOAuthState(request.query.state as string, request.logger)
            if (prRedirectRequired(state.prNumber)) {
              console.log(`this is the pr Number: ${state.prNumber}`)
              if (prRedirectEnabled()) {
                const queryString = new URLSearchParams(request.query).toString()
                return h.redirect(getPrBranchUrl(state.prNumber, path, queryString))
                console.log(`what is h: ${typeof test}`)
              }
            }
          }
        }
        console.log("normal path for: " + path)

        return h.view("index", {
          baseUrl: CONFIG.baseUrl,
          environment: CONFIG.environment
        })
      }
    }

    if (skipAuth) {
      return {
        ...viewRoute,
        options: {
          auth: false
        } as RouteOptions
      }
    }

    return viewRoute
  }
}

init()
