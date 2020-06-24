import {Boom} from '@hapi/boom'
import Hapi from '@hapi/hapi'
import routes from './routes'
import {CodeableConcept, Coding, OperationOutcome, OperationOutcomeIssue} from "./services/fhir-resources";

const CONTENT_TYPE = 'application/fhir+json; fhirVersion=4.0'

const preResponse = function (request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit) {
    const response = request.response

    // Don't reformat non-error responses
    if (!(response instanceof Boom)) {
        // Set Content-Type on all responses
        response.type(CONTENT_TYPE)
        return responseToolkit.continue
    }

    console.log(response)

    /* Reformat errors to FHIR spec
      Expects request.response is a Boom object with following properties:
      * Boom Standard:
        * message: human-readable error message
        * output.statusCode: HTTP status code
      * Custom:
        * data.operationOutcomeCode: from the [IssueType ValueSet](https://www.hl7.org/fhir/valueset-issue-type.html)
        * data.apiErrorCode: Our own code defined for each particular error. Refer to OAS.
    */
    const fhirError = convertBoomToOperationOutcome(response)
    return responseToolkit.response(fhirError)
        .code(response.output.statusCode)
        .type(CONTENT_TYPE)
}

function convertBoomToOperationOutcome(boom: Boom) {
    // Generically present all errors not explicitly thrown by us as internal server errors
    if (!boom.data) {
        boom.data = {
            'apiErrorCode': 'internalServerError',
            'operationOutcomeCode': 'exception'
        }
    }

    const detailsCoding = new Coding()
    detailsCoding.system = "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode"
    detailsCoding.version = 1
    detailsCoding.code = boom.data.apiErrorCode
    detailsCoding.display = boom.message

    const detailsCodeableConcept = new CodeableConcept()
    detailsCodeableConcept.coding = [detailsCoding]

    const operationOutcome = new OperationOutcome();
    operationOutcome.issue = [
        new OperationOutcomeIssue("error", boom.data.operationOutcomeCode, detailsCodeableConcept)
    ]
    return operationOutcome
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
