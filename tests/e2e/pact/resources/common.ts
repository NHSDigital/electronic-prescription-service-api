import {fhir} from "@models"
import { PactOptions } from "@pact-foundation/pact"
import path from "path"

export const basePath = "/FHIR/R4"

export type ApiMode = "live" | "sandbox"
export type ApiEndpoint = "prepare" | "process" | "task" | "claim" |
  "validate" | "verify-signature" | "metadata" | "tracker"
export type ApiOperation = "send" | "cancel" | "dispense" | "dispenseamend" |
                        "release" | "return" | "withdraw" | "amend"

// used to add type-safety for adding a new pact
export function pactOptions(mode: ApiMode, endpoint: ApiEndpoint, operation?: ApiOperation): PactOptions {
  const sandbox = mode === "sandbox"
  const pacticipant_suffix = sandbox ? "-sandbox" : ""
  return {
    spec: 2,
    consumer: `nhsd-apim-eps-test-client${pacticipant_suffix}+${process.env.PACT_VERSION}`,
    /* eslint-disable-next-line max-len */
    provider: `nhsd-apim-eps${pacticipant_suffix}+${endpoint}${operation ? "-" + operation : ""}+${process.env.PACT_VERSION}`,
    pactfileWriteMode: "merge",
    dir: path.join(__dirname, "../pact/pacts"),
    logLevel: "info"
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
