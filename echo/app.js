const Hapi = require("@hapi/hapi")

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

  server.route({
    method: "POST",
    path: "/{param*}",
    handler: async (request, responseToolkit) => {
      return responseToolkit.response(request.payload)
    }
  })

  server.route({
    method: "GET",
    path: "/_status",
    handler: async (request, responseToolkit) => {
      return responseToolkit.response()
    }
  })

  await server.start()
  console.log("Server running on %s", server.info.uri)
}

process.on("unhandledRejection", (err) => {
  console.log(err)
  process.exit(1)
})

init()
