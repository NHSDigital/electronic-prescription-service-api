import Boom from 'boom'
import Hapi from '@hapi/hapi'
import Path from 'path'
import * as routes from './routes'
import {OperationOutcome} from "./services/fhir-resources";

const CONTENT_TYPE = 'application/fhir+json; fhirVersion=4.0'

function isResponseObject(obj: Hapi.ResponseObject | Error): obj is Hapi.ResponseObject {
    return (obj as Hapi.ResponseObject).type !== undefined
}

const preResponse = function (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) {
    const response = request.response

    // Don't reformat non-error responses
    if (isResponseObject(response)) {
        // Set Content-Type on all responses
        response.type(CONTENT_TYPE)
        return responseToolkit.continue
    }

    const error = response

    // Generically present all errors not explicitly thrown by
    // us as internal server errors
    if (!error.data) {
        error.data = {
            'apiErrorCode': 'internalServerError',
            'operationOutcomeCode': 'exception'
        }
    }

    /* Reformat errors to FHIR spec
      Expects request.response is a Boom object with following properties:
      * Boom Standard:
        * message: human-readable error message
        * output.statusCode: HTTP status code
      * Custom:
        * data.operationOutcomeCode: from the [IssueType ValueSet](https://www.hl7.org/fhir/valueset-issue-type.html)
        * data.apiErrorCode: Our own code defined for each particular error. Refer to OAS.
    */
    const fhirError = new OperationOutcome(error as Boom)

    return responseToolkit.response(fhirError)
        .code(error.output.statusCode)
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

    server.route(routes.routes)

    await server.start()
    console.log('Server running on %s', server.info.uri)
}

process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
})

init()
