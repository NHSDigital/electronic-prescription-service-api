'use strict'

const Hapi = require('@hapi/hapi')
const Path = require('path')
const Inert = require('inert')
const routes = require('./routes/index')

const CONTENT_TYPE = 'application/fhir+json; fhirVersion=4.0'

const preResponse = function (request, h) {
  const response = request.response
  
  return h.response(response)
    .type(CONTENT_TYPE)
}

const init = async () => {
  const server = Hapi.server({
    port: 9000,
    host: '0.0.0.0',
    routes: {
      cors: true, // Won't run as Apigee hosted target without this
      files: {
        relativeTo: Path.join(__dirname, 'mocks')
      }
    }
  })
  server.ext('onPreResponse', preResponse)

  await server.register(Inert)

  server.route(routes)

  await server.start()
  console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', (err) => {
  console.log(err)
  process.exit(1)
})

init()
