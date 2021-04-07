import {JestPactOptions} from "jest-pact"
import {fhir} from "@models"

export const basePath = "/FHIR/R4"

export type ApiMode = "live" | "sandbox"
export type ApiEndpoint = "prepare" | "process" | "convert" | "task"
export type ApiOperation = "send" | "cancel" | "dispense" | "release" | "return" | "withdraw"

// todo, remove live/sandbox split once dispense interactions are handled in live proxies
const liveProcessMessageOperations: Array<ApiOperation> = ["send", "cancel"]
const liveTaskOperations: Array<ApiOperation> = []
const sandboxProcessMessageOperations: Array<ApiOperation> = ["send", "cancel", "dispense"]
const sandboxTaskOperations: Array<ApiOperation> = ["release", "return", "withdraw"]
const isSandbox = process.env.APIGEE_ENVIRONMENT?.includes("sandbox")
export const processMessageOperations = isSandbox ? sandboxProcessMessageOperations : liveProcessMessageOperations
export const taskOperations = isSandbox ? sandboxTaskOperations : liveTaskOperations

// used to add type-safety for adding a new pact
export function pactOptions(mode: ApiMode, endpoint: ApiEndpoint, operation?: ApiOperation): JestPactOptions
{
  const sandbox = mode === "sandbox"
  return {
    spec: 3,
    consumer: `nhsd-apim-eps-test-client+${process.env.PACT_VERSION}`,
    provider: `nhsd-apim-eps${sandbox ? "-sandbox" : ""}+${endpoint}${operation ? "-" + operation : ""}+${process.env.PACT_VERSION}`,
    pactfileWriteMode: "merge"
  }
}

// helper functions
function isStringParameter(parameter: fhir.Parameter): parameter is fhir.StringParameter {
  return (parameter as fhir.StringParameter).valueString !== undefined
}

export function getStringParameterByName(parameters: fhir.Parameters, name: string): fhir.StringParameter {
  const stringParams = parameters.parameter.filter(param => isStringParameter(param)) as Array<fhir.StringParameter>
  const namedStringParams = stringParams.filter(param => param.name === name)
  if (namedStringParams.length === 1) return namedStringParams[0]
}
