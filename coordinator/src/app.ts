import {Boom} from '@hapi/boom'
import Hapi from '@hapi/hapi'
import routes from './routes'

const CONTENT_TYPE = 'application/fhir+json; fhirVersion=4.0'

const preResponse = function (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) {
    const response = request.response
    if (response instanceof Boom) {
        console.log(response)
    } else {
        // Set Content-Type on all responses
        response.type(CONTENT_TYPE)
    }
    return responseToolkit.continue
}

const init = async () => {
    const server = Hapi.server({
        port: 9000,
        host: '0.0.0.0',
        routes: {
            cors: true // Won't run as Apigee hosted target without this
        }
    })
    server.ext('onPreResponse', preResponse)

    server.route(routes)

    await server.start()
    console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
})

init()
