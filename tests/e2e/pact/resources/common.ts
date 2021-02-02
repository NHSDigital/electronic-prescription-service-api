import * as fhir from "../models/fhir/fhir-resources"
import {JestPactOptions} from "jest-pact"
import path from "path"
import {ExampleFile} from "../models/files/example-file"

export type ApiMode = "live" | "sandbox"

export type ApiEndpoint = "prepare" | "process" | "convert" | "release"

export type PactGroup =
  "accept-header"
  | "failures"
  | "secondarycare-community-acute"
  | "secondarycare-community-repeatdispensing"
  | "secondarycare-homecare"

export function pactOptions(mode: ApiMode, endpoint: ApiEndpoint, group?: PactGroup): JestPactOptions {
const sandbox = mode === "sandbox"
return {
      spec: 3,
    consumer: `nhsd-apim-eps-test-client+${process.env.PACT_VERSION}`,
    provider: `nhsd-apim-eps${sandbox ? "-sandbox" : ""}+${endpoint}${group ? "-" + group : ""}+${process.env.PACT_VERSION}`,
    pactfileWriteMode: "overwrite"
  }
}

function isStringParameter(parameter: fhir.Parameter): parameter is fhir.StringParameter {
  return (parameter as fhir.StringParameter).valueString !== undefined
}

export function getStringParameterByName(parameters: fhir.Parameters, name: string): fhir.StringParameter {
  const stringParams = parameters.parameter.filter(param => isStringParameter(param)) as Array<fhir.StringParameter>
  const namedStringParams = stringParams.filter(param => param.name === name)
  if (namedStringParams.length === 1) return namedStringParams[0]
}

const examplesRootPath = "../resources/parent-prescription"
export function createExampleDescription(exampleFile: ExampleFile): string {
  return path.parse(path.relative(path.join(__dirname, examplesRootPath), exampleFile.path))
    .dir
    .replace(/\//g, " ")
    .replace(/\\/g, " ")
    + " "
    + `${exampleFile.number} ${exampleFile.statusText} ${exampleFile.operation}`
}
