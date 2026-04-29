import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3"
import Hapi from "@hapi/hapi"
import {fhir, processingErrors, validationErrors} from "@models"
import {ContentTypes} from "../routes/util"
import {Boom} from "@hapi/boom"
import {RequestHeaders} from "./headers"
import {isProd} from "./environment"
import {isEpsHostedContainer} from "./feature-flags"

export const fatalResponse = {
  resourceType: "OperationOutcome",
  issue: [
    {
      severity: "fatal",
      code: "exception",
      details: {
        coding: [
          {
            system: "https://fhir.nhs.uk/CodeSystem/http-error-codes",
            code: "SERVER_ERROR",
            display: "500: The Server has encountered an error processing the request."
          }
        ]
      }
    }
  ]
}

export function reformatUserErrorsToFhir(
  request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
): Hapi.ResponseObject | symbol {
  const response = request.response
  const logger = request.logger
  if (response instanceof processingErrors.InconsistentValuesError) {
    const newResponse = processingErrors.toOperationOutcomeError(response)
    logger.warn({
      requestPayload: getPayload(request),
      response: newResponse
    }, "InconsistentValuesError")
    return responseToolkit.response(newResponse).code(400).type(ContentTypes.FHIR)
  } else if (response instanceof processingErrors.FhirMessageProcessingError) {
    const newResponse = processingErrors.toOperationOutcomeFatal(response)
    logger.warn({
      requestPayload: getPayload(request),
      response: newResponse
    }, "FhirMessageProcessingError")
    return responseToolkit.response(newResponse).code(400).type(ContentTypes.FHIR)
  } else if (response instanceof Boom) {
    // Boom is an unhandled error that gets handled gracefully in hapi
    // we log the original response here but we send back a FHIR compliant response
    // we also log a stack trace so we can see where the error came from
    logger.error({
      requestPayload: getPayload(request),
      originalResponse: response,
      stackTrace: response.stack
    }, "Boom")
    return responseToolkit.response(
      fatalResponse
    ).code(500).type(ContentTypes.FHIR)
  } else {
    if (response.statusCode >= 400) {
      // we DO log response here as we are sending back the same response
      logger.warn({
        requestPayload: getPayload(request),
        response: {
          headers: response.headers,
          payload: response.source,
          statusCode: response.statusCode
        }
      }, "ErrorOrWarningResponse")
    }
  }
  return responseToolkit.continue
}

function getPayload(request: Hapi.Request<Hapi.ReqRefDefaults>) {
  if (request.payload) {
    if (request.payload instanceof Buffer) {
      return request.payload.toString()
    }
    return request.payload
  }
  return {}
}

export function switchContentTypeForSmokeTest(
  request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
): Hapi.ResponseObject | symbol {
  const isSmokeTest = request.headers[RequestHeaders.SMOKE_TEST]
  if (!isSmokeTest) {
    return responseToolkit.continue
  }

  const response = request.response
  if (response instanceof Boom) {
    return responseToolkit.continue
  }

  const responseAsRequest = (response as Hapi.ResponseObject)
  const contentType = responseAsRequest.headers["content-type"]
  if (contentType === ContentTypes.FHIR) {
    responseAsRequest.type(ContentTypes.JSON)
  } else if (contentType === ContentTypes.XML) {
    responseAsRequest.type(ContentTypes.PLAIN_TEXT)
  }

  return responseToolkit.continue
}

export const invalidProdHeaders: Array<RequestHeaders> = [RequestHeaders.RAW_RESPONSE, RequestHeaders.SKIP_VALIDATION]

export const rejectInvalidProdHeaders: Hapi.Lifecycle.Method = (
  request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
) => {
  const logger = request.logger
  if (isProd()) {
    const listOfInvalidHeaders = Object.keys(request.headers).filter(
      requestHeader => invalidProdHeaders.includes(requestHeader as RequestHeaders)
    )
    if (listOfInvalidHeaders.length) {
      const errorMessage = `Request with id: ${
        request.headers[RequestHeaders.REQUEST_ID]
      } had invalid header(s): ${
        listOfInvalidHeaders
      }`
      logger.error({
        payload: getPayload(request),
        errorMessage
      }, "invalid headers")

      const issue = validationErrors.invalidHeaderOperationOutcome(listOfInvalidHeaders)
      return responseToolkit
        .response(fhir.createOperationOutcome([issue]))
        .code(403)
        .type(ContentTypes.FHIR)
        .takeover()
    }
  }
  return responseToolkit.continue
}

const toBeObserved = (request: Hapi.Request) => {
  const routesString = process.env["OBSERVABILITY_ROUTES"]
  const routes: Array<string> = routesString ? routesString.split(",") : []
  return [
    isEpsHostedContainer(),
    routes.some(r => request.path.toLowerCase().endsWith(r))
  ].every(c => c)
}

const writeToObservabilityBucket = async (
  data: string, key: string
) => {
  const client = new S3Client({"region": "eu-west-2"})
  const command = new PutObjectCommand({
    "Bucket": process.env["OBSERVABILITY_BUCKET_NAME"],
    "Key": key,
    "Body": data
  })

  await client.send(command)
}

export const writeRequestToObservabilityBucket: Hapi.Lifecycle.Method = async (
  request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
) => {
  if (toBeObserved(request) && request.payload) {
    try {
      await writeToObservabilityBucket(
        JSON.stringify(getPayload(request)),
        `${request.headers[RequestHeaders.REQUEST_ID]}/request`
      )
    } catch(err) {
      request.logger.warn({err}, "Error writing request to observability bucket")
    }
  }
  return responseToolkit.continue
}

export const writeResponseToObservabilityBucket: Hapi.Lifecycle.Method = async (
  request: Hapi.Request, responseToolkit: Hapi.ResponseToolkit
) => {
  if (toBeObserved(request)) {
    try {
      let responseData: string
      const response = request.response
      if (response instanceof Boom) {
        responseData = response.output.payload.message
      } else {
        responseData = response.source?.toString() ?? ""
      }

      if (responseData) {
        await writeToObservabilityBucket(
          responseData,
          `${request.headers[RequestHeaders.REQUEST_ID]}/response`
        )
      }

    } catch(err) {
      request.logger.warn({err}, "Error writing response to observability bucket")
    }
  }
  return responseToolkit.continue
}
