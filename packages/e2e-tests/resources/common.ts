import {fhir} from "@models"
import {InteractionObject, PactOptions} from "@pact-foundation/pact"
import path from "path"
import * as uuid from "uuid"
import * as LosslessJson from "lossless-json"
import {HTTPMethod} from "@pact-foundation/pact/src/common/request"
import {AnyTemplate} from "@pact-foundation/pact/src/dsl/matchers"

export const basePath = "/FHIR/R4"

export class CreatePactOptions {
  apiMode: ApiMode
  apiEndpoint: ApiEndpoint
  apiOperation?: ApiOperation
  constructor(apiMode: ApiMode, apiEndpoint: ApiEndpoint, apiOperation?: ApiOperation) {
    this.apiMode = apiMode
    this.apiEndpoint = apiEndpoint
    this.apiOperation = apiOperation
  }
}

export type ApiMode = "live" | "sandbox" | "proxygen"
export type ApiEndpoint = "prepare" | "process" | "task" | "claim" |
  "validate" | "metadata"
export type ApiOperation = "send" | "cancel" | "dispense" | "dispenseamend" |
                        "release" | "return" | "withdraw" | "amend" | "tracker"

// used to add type-safety for adding a new pact
export function pactOptions(options: CreatePactOptions): PactOptions {
  const pacticipant_suffix = getPacticipantSuffix(options.apiMode)
  const providerName = createProviderName(
    pacticipant_suffix,
    options.apiEndpoint,
    options.apiOperation,
    process.env.PACT_VERSION
  )
  const consumerName = createConsumerName(
    pacticipant_suffix,
    process.env.PACT_VERSION
  )
  return {
    spec: 2,
    consumer: consumerName,
    provider: providerName,
    pactfileWriteMode: "merge",
    dir: path.join(__dirname, "../pact/pacts"),
    logLevel: "info"
  }
}

// helper functions

export function getProviderBaseUrl(apiProduct, endpoint, operation) {
  switch(apiProduct) {
    case "sandbox": {
      return process.env.PACT_PROVIDER_URL
    }
    case "proxygen": {
      return getProxygenProviderBaseUrl(endpoint, operation)
    }
    case "live": {
      return process.env.PACT_PROVIDER_URL
    }
    default: {
      throw new Error("Unknown api mode")
    }
  }
}

function getProxygenProviderBaseUrl(endpoint, operation) {
  switch(endpoint) {
    case "validate": {
      return process.env.PACT_PROVIDER_PRESCRIBING_URL
    }
    case "prepare": {
      return process.env.PACT_PROVIDER_PRESCRIBING_URL
    }
    case "process": {
      switch(operation) {
        case "send": {
          return process.env.PACT_PROVIDER_PRESCRIBING_URL
        }
        case "cancel": {
          return process.env.PACT_PROVIDER_DISPENSING_URL
        }
        case "dispense": {
          return process.env.PACT_PROVIDER_DISPENSING_URL
        }
        case "dispenseamend": {
          return process.env.PACT_PROVIDER_DISPENSING_URL
        }
        default: {
          throw new Error("Unknown endpoint")
        }
      }
    }
    case "task": {
      switch(operation) {
        case "release": {
          return process.env.PACT_PROVIDER_DISPENSING_URL
        }
        case "return": {
          return process.env.PACT_PROVIDER_DISPENSING_URL
        }
        case "withdraw": {
          return process.env.PACT_PROVIDER_DISPENSING_URL
        }
        case "tracker": {
          return process.env.PACT_PROVIDER_DISPENSING_URL
        }
        default: {
          throw new Error("Unknown endpoint")
        }
      }
    }
    case "claim": {
      return process.env.PACT_PROVIDER_DISPENSING_URL
    }
    case "metadata": {
      return process.env.PACT_PROVIDER_DISPENSING_URL
    }
    default: {
      throw new Error("Unknown endpoint")
    }
  }
}

export function getPacticipantSuffix(apiMode) {
  switch(apiMode) {
    case "sandbox": {
      return "sandbox"
    }
    case "proxygen": {
      return "proxygen"
    }
    case "live": {
      return "live"
    }
    default: {
      throw new Error("Unknown apiMode")
    }
  }
}

export function createConsumerName(
  pacticipant_suffix: string,
  pact_version: string
) {
  return `${pacticipant_suffix}+${pact_version}`
}

export function createProviderName(
  pacticipant_suffix: string,
  apiEndpoint: string,
  apiOperation: string,
  pact_version: string
) {
  return `${pacticipant_suffix}+${apiEndpoint}+${apiOperation}+${pact_version}`
}

function isStringParameter(parameter: fhir.Parameter): parameter is fhir.StringParameter {
  return (parameter as fhir.StringParameter).valueString !== undefined
}

export function getStringParameterByName(parameters: fhir.Parameters, name: string): fhir.StringParameter {
  const stringParams = parameters.parameter.filter(param => isStringParameter(param)) as Array<fhir.StringParameter>
  const namedStringParams = stringParams.filter(param => param.name === name)
  if (namedStringParams.length === 1) return namedStringParams[0]
}

export const successfulOperationOutcome = {
  resourceType: "OperationOutcome",
  issue: [
    {
      code: "informational",
      severity: "information",
      details: undefined
    }
  ]
}

export function getHeaders(): {[header: string]: string} {
  const requestId = uuid.v4()
  const correlationId = uuid.v4()
  return {
    "Content-Type": "application/fhir+json; fhirVersion=4.0",
    "X-Request-ID": requestId,
    "X-Correlation-ID": correlationId,
    "Authorization": `Bearer ${process.env.APIGEE_ACCESS_TOKEN}`
  }
}

export function createInteraction(
  options: CreatePactOptions,
  requestBody?: fhir.Resource,
  responseExpectation?: AnyTemplate,
  uponReceiving?: string,
  statusCodeExpectation?: number
): InteractionObject {
  const path = getApiPath(options.apiEndpoint, options.apiOperation)
  const method = getHttpMethod(options.apiEndpoint, options.apiOperation)
  if (method === "POST" && !requestBody) {
    throw new Error(`Endpoint: '${options.apiEndpoint}' expects a POST, missing: 'requestBody'`)
  }

  const interaction: InteractionObject = {
    state: null,
    uponReceiving: uponReceiving ?? "a valid FHIR message",
    withRequest: {
      headers: getHeaders(),
      method,
      path,
      body: requestBody ? LosslessJson.stringify(requestBody) : undefined
    },
    willRespondWith: {
      headers: {
        "Content-Type": "application/fhir+json; fhirVersion=4.0"
      },
      body: responseExpectation,
      status: statusCodeExpectation ?? 200
    }
  }

  return interaction
}

function getHttpMethod(endpoint: ApiEndpoint, apiOperation: ApiOperation): HTTPMethod {
  switch (endpoint) {
    case "prepare":
    case "process":
    case "validate":
    case "claim":
      return "POST"

    case "task":
      switch(apiOperation) {
        case "tracker":
          return "GET"
        default:
          return "POST"
      }
    case "metadata":
      return "GET"

    default:
      throw new Error(`Could not get the correct HTTP Method for endpoint: '${endpoint}'`)
  }
}

function getApiPath(endpoint: ApiEndpoint, apiOperation: ApiOperation): string {
  switch (endpoint) {
    case "metadata":
      return "/metadata"
    case "prepare":
      return `${basePath}/$prepare`
    case "process":
      return `${basePath}/$process-message`
    case "validate":
      return `${basePath}/$validate`
    case "claim":
      return `${basePath}/Claim`
    case "task":
      switch(apiOperation) {
        case "return":
        case "withdraw":
        case "tracker":
          return `${basePath}/Task`
        case "release":
          return `${basePath}/Task/$release`
      }
      break

    default:
      throw new Error(`Could not get the correct api path for endpoint: '${endpoint}'`)
  }
}
