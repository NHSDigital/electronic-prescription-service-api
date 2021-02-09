import * as fhir from "../models/fhir/fhir-resources"
import {IdentifierExtension} from "../models/fhir/fhir-resources"
import {JestPactOptions} from "jest-pact"
import path from "path"
import {ExampleFile} from "../models/files/example-file"
import * as uuid from "uuid"

export const basePath = "/FHIR/R4"

export type ApiMode = "live" | "sandbox"

export type ApiEndpoint = "prepare" | "process" | "convert" | "release"

export const PactGroups = [
  "accept-header",
  "failures",
  "secondarycare-community-acute",
  "secondarycare-community-repeatdispensing",
  "secondarycare-homecare"
]
export type PactGroup = typeof PactGroups

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


/**
 * The following methods contain a lot of duplicated code from the coordinator module.
 * TODO - Find a better way to share this code.
 */
function generateShortFormID() {
  const _PRESC_CHECKDIGIT_VALUES = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+"
  const hexString = (uuid.v4()).replace(/-/g, "").toUpperCase()
  let prescriptionID = hexString.substring(0, 6) + "-" + "A99968" + "-" + hexString.substring(12, 17)
  const prscID = prescriptionID.replace(/-/g, "")
  const prscIDLength = prscID.length
  let runningTotal = 0
  let checkValue
  const strings = prscID.split("")
  strings.forEach((character, index) => {
    runningTotal = runningTotal + parseInt(character, 36) * (2 ** (prscIDLength - index))
  })
  checkValue = (38 - runningTotal % 37) % 37
  checkValue = _PRESC_CHECKDIGIT_VALUES.substring(checkValue, checkValue+1)
  prescriptionID += checkValue
  return prescriptionID
}

function getLongFormIdExtension(extensions: Array<fhir.Extension>): IdentifierExtension {
  return extensions.find(
    extension => extension.url === "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId"
  ) as IdentifierExtension
}

function getMedicationRequests(bundle: fhir.Bundle): Array<fhir.MedicationRequest> {
  return bundle.entry
    .filter(entry => entry.resource.resourceType === "MedicationRequest")
    .map(entry => entry.resource) as Array<fhir.MedicationRequest>
}

export function updatePrescriptionIds(bundle: fhir.Bundle): void {
  bundle.identifier.value = uuid.v4()
  getMedicationRequests(bundle)
    .forEach(medicationRequest => {
      medicationRequest.groupIdentifier.value = generateShortFormID()
      const extensions = medicationRequest.groupIdentifier.extension
      const extension = getLongFormIdExtension(extensions)
      extension.valueIdentifier.value = uuid.v4()
    })
}
