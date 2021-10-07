import Hapi from "@hapi/hapi"
import routes from "./routes"
import HapiPino from "hapi-pino"

const init = async () => {
  const server = Hapi.server({
    port: 9002,
    host: "0.0.0.0",
    routes: {
      cors: true, // Won't run as Apigee hosted target without this
      payload: {
        parse: false
      }
    }
  })

  server.route(routes)

  await server.register({
    plugin: HapiPino,
    options: {
      // Dont pretty print to avoid spamming logs
      prettyPrint: false,
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
