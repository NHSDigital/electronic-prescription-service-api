import Hapi from '@hapi/hapi'
import routes from './routes'

const init = async () => {
    const server = Hapi.server({
        port: 9000,
        host: '0.0.0.0',
        routes: {
            cors: true // Won't run as Apigee hosted target without this
        }
    })

    server.route(routes)

    await server.start()
    console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
})

init()
