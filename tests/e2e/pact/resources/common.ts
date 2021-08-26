import {JestPactOptions} from "jest-pact"
import {fhir} from "@models"

export const basePath = "/FHIR/R4"

export type ApiMode = "live" | "sandbox"
export type ApiEndpoint = "prepare" | "process" | "task" | "validate" | "verify-signature" | "metadata" | "tracker"
export type ApiOperation = "send" | "cancel" | "dispense" | "release" | "return" | "withdraw" | "claim"

// used to add type-safety for adding a new pact
export function pactOptions(mode: ApiMode, endpoint: ApiEndpoint, operation?: ApiOperation): JestPactOptions {
  const sandbox = mode === "sandbox"
  const pacticipant_suffix = sandbox ? "-sandbox" : ""
  return {
    spec: 2,
    consumer: `nhsd-apim-eps-test-client${pacticipant_suffix}+${process.env.PACT_VERSION}`,
    /* eslint-disable-next-line max-len */
    provider: `nhsd-apim-eps${pacticipant_suffix}+${endpoint}${operation ? "-" + operation : ""}+${process.env.PACT_VERSION}`,
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
