import {fhir} from "@models"
import {InteractionObject, PactV2Options} from "@pact-foundation/pact"
import path from "path"
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

export type ApiMode = "live" | "sandbox"
export type ApiEndpoint = "prepare" | "process" | "task" | "claim" |
  "validate" | "metadata"
export type ApiOperation = "send" | "cancel" | "dispense" | "dispenseamend" |
  "release" | "return" | "withdraw" | "amend" | "tracker"

// used to add type-safety for adding a new pact
export function pactOptions(options: CreatePactOptions): PactV2Options {
  const pactVersion = getRequiredEnvVar("PACT_VERSION")
  const pacticipantSuffix = getPacticipantSuffix(options.apiMode)
  const providerName = createProviderName(
    pacticipantSuffix,
    options.apiEndpoint,
    pactVersion,
    options.apiOperation ?? ""
  )
  const consumerName = createConsumerName(
    pacticipantSuffix,
    pactVersion
  )
  return {
    spec: 4,
    consumer: consumerName,
    provider: providerName,
    pactfileWriteMode: "merge",
    dir: path.join(__dirname, "../pact/pacts"),
    logLevel: "info"
  }
}

// helper functions

function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function getProviderBaseUrl(
  apiDeploymentMethod: string,
  endpoint: ApiEndpoint,
  operation?: ApiOperation
): string {
  switch (apiDeploymentMethod) {
    case "apim": {
      return getRequiredEnvVar("PACT_PROVIDER_URL")
    }
    case "proxygen": {
      return getProxygenProviderBaseUrl(endpoint, operation)
    }
    default: {
      throw new Error("Unknown api deployment method")
    }
  }
}

function getProxygenProviderBaseUrl(endpoint: ApiEndpoint, operation?: ApiOperation): string {
  switch (endpoint) {
    case "validate": {
      return getRequiredEnvVar("PACT_PROVIDER_PRESCRIBING_URL")
    }
    case "prepare": {
      return getRequiredEnvVar("PACT_PROVIDER_PRESCRIBING_URL")
    }
    case "process": {
      switch (operation) {
        case "send": {
          return getRequiredEnvVar("PACT_PROVIDER_PRESCRIBING_URL")
        }
        case "cancel": {
          return getRequiredEnvVar("PACT_PROVIDER_DISPENSING_URL")
        }
        case "dispense": {
          return getRequiredEnvVar("PACT_PROVIDER_DISPENSING_URL")
        }
        case "dispenseamend": {
          return getRequiredEnvVar("PACT_PROVIDER_DISPENSING_URL")
        }
        default: {
          throw new Error("Unknown endpoint")
        }
      }
    }
    case "task": {
      switch (operation) {
        case "release": {
          return getRequiredEnvVar("PACT_PROVIDER_DISPENSING_URL")
        }
        case "return": {
          return getRequiredEnvVar("PACT_PROVIDER_DISPENSING_URL")
        }
        case "withdraw": {
          return getRequiredEnvVar("PACT_PROVIDER_DISPENSING_URL")
        }
        case "tracker": {
          return getRequiredEnvVar("PACT_PROVIDER_DISPENSING_URL")
        }
        default: {
          throw new Error("Unknown endpoint")
        }
      }
    }
    case "claim": {
      return getRequiredEnvVar("PACT_PROVIDER_DISPENSING_URL")
    }
    case "metadata": {
      return getRequiredEnvVar("PACT_PROVIDER_DISPENSING_URL")
    }
    default: {
      throw new Error("Unknown endpoint")
    }
  }
}

export function getPacticipantSuffix(apiMode: ApiMode): string {
  switch (apiMode) {
    case "sandbox": {
      return "sandbox"
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
  pacticipantSuffix: string,
  apiEndpoint: string,
  pactVersion: string,
  apiOperation: string
) {
  return `${pacticipantSuffix}+${apiEndpoint}+${apiOperation ? apiOperation : ""}+${pactVersion}`
}

function isStringParameter(parameter: fhir.Parameter): parameter is fhir.StringParameter {
  return (parameter as fhir.StringParameter).valueString !== undefined
}

export function getStringParameterByName(parameters: fhir.Parameters, name: string): fhir.StringParameter {
  const stringParams = parameters.parameter.filter(param => isStringParameter(param)) as Array<fhir.StringParameter>
  const namedStringParams = stringParams.filter(param => param.name === name)
  if (namedStringParams.length === 1) {
    return namedStringParams[0]
  }

  throw new Error(`Expected exactly one string parameter named '${name}'`)
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
  const requestId = crypto.randomUUID()
  const correlationId = crypto.randomUUID()
  return {
    "Content-Type": "application/fhir+json; fhirVersion=4.0",
    "X-Request-ID": requestId,
    "X-Correlation-ID": correlationId,
    "Authorization": "dummy auth header"
  }
}

export function createInteraction(
  options: CreatePactOptions,
  requestBody?: fhir.Resource,
  responseExpectation?: AnyTemplate,
  uponReceiving?: string,
  statusCodeExpectation?: number
): InteractionObject {
  let path: string
  let method: HTTPMethod

  if (options.apiEndpoint === "task") {
    const taskOperation = getRequiredTaskOperation(options.apiOperation)
    path = getTaskApiPath(taskOperation)
    method = getTaskHttpMethod(taskOperation)
  } else {
    path = getApiPath(options.apiEndpoint)
    method = getHttpMethod(options.apiEndpoint)
  }

  if (method === "POST" && !requestBody) {
    throw new Error(`Endpoint: '${options.apiEndpoint}' expects a POST, missing: 'requestBody'`)
  }

  const interaction: InteractionObject = {
    state: undefined,
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

type TaskApiOperation = Extract<ApiOperation, "release" | "return" | "withdraw" | "tracker">

function getRequiredTaskOperation(apiOperation?: ApiOperation): TaskApiOperation {
  switch (apiOperation) {
    case "release":
    case "return":
    case "withdraw":
    case "tracker":
      return apiOperation
    default:
      throw new Error("Task endpoint expects a valid apiOperation")
  }
}

function getHttpMethod(endpoint: Exclude<ApiEndpoint, "task">): HTTPMethod {
  switch (endpoint) {
    case "prepare":
    case "process":
    case "validate":
    case "claim":
      return "POST"
    case "metadata":
      return "GET"

    default:
      throw new Error(`Could not get the correct HTTP Method for endpoint: '${endpoint}'`)
  }
}

function getTaskHttpMethod(apiOperation: TaskApiOperation): HTTPMethod {
  switch (apiOperation) {
    case "tracker":
      return "GET"
    case "release":
    case "return":
    case "withdraw":
      return "POST"
  }
}

function getApiPath(endpoint: Exclude<ApiEndpoint, "task">): string {
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
  }

  throw new Error(`Could not get the correct api path for endpoint: '${endpoint}'`)
}

function getTaskApiPath(apiOperation: TaskApiOperation): string {
  switch (apiOperation) {
    case "return":
    case "withdraw":
    case "tracker":
      return `${basePath}/Task`
    case "release":
      return `${basePath}/Task/$release`
  }
}
