import Hapi from "@hapi/hapi"
import routes from "./routes"
import HapiPino from "hapi-pino"
import Vision from "@hapi/vision"
// import * as inert from "@hapi/inert"
import Yar from "@hapi/yar"
import {isLocal} from "./services/environment"
import axios from "axios"

const init = async () => {
  axios.defaults.validateStatus = () => true

  const server = Hapi.server({
    port: 9000,
    host: "0.0.0.0",
    routes: {
      cors: true, // Won't run as Apigee hosted target without 
      files: {
        relativeTo: `${__dirname}/static/examples`
      }
    }
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

  // await server.register(inert)

  // server.route({
  //   method: "GET",
  //   path: `/static/examples/{param*}`,
  //   handler: {
  //     directory: {
  //       path: "static/examples"
  //     },
  //     files: {
  //       relativeTo: __dirname
  //     }
  //   }
  // })

  await server.register(Vision)

  server.views({
    engines: {
      html: require("handlebars")
    },
    relativeTo: __dirname,
    path: "templates"
  })

  server.route(addHomeViewRoute())
  server.route(addViewRoute("login"))
  server.route(addViewRoute("my-prescriptions"))

  function addHomeViewRoute() : Hapi.ServerRoute {

    const baseUrl = process.env.BASE_PATH
      ? `/${process.env.BASE_PATH}/`
      : "/"

    return {
      method: "GET",
      path: `/`,
      handler: {
        view: {
          template: "index",
          context: {
            baseUrl,
            environment: process.env.ENVIRONMENT
          }
        }
      }
    }
  }

  function addViewRoute(path: string): Hapi.ServerRoute {
    const baseUrl = process.env.BASE_PATH
      ? `/${process.env.BASE_PATH}/`
      : "/"

    return {
      method: "GET",
      path: `/${path}`,
      handler: {
        view: {
          template: "index",
          context: {
            baseUrl,
            environment: process.env.ENVIRONMENT
          }
        }
      }
    }
  }

  await server.start()
  server.log("info", `Server running on ${server.info.uri}`)
}

process.on("unhandledRejection", err => {
  console.log(err)
  process.exit(1)
})

init()
