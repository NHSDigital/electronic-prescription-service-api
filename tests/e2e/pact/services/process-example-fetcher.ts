import {ProcessCase} from "../models/cases/process-case"
import {exampleFiles} from "./example-files-fetcher"
import * as uuid from "uuid"
import * as fhir from "../models/fhir/fhir-resources"
import {MedicationRequest} from "../../../../coordinator/src/models/fhir/medication-request"

const processRequestFiles = exampleFiles.filter(exampleFile => exampleFile.isRequest && exampleFile.endpoint === "process")
const prescriptionOrderFiles = processRequestFiles.filter(exampleFile => exampleFile.operation === "send")
const prescriptionOrderUpdateFiles = processRequestFiles.filter(exampleFile => exampleFile.operation === "cancel")
const prescriptionOrderExamples: ProcessCase[] = prescriptionOrderFiles.map(processRequestFile =>
  new ProcessCase(processRequestFile, null)
)
const prescriptionOrderUpdateExamples: ProcessCase[] = prescriptionOrderUpdateFiles.map(processRequestFile =>
  new ProcessCase(processRequestFile, null)
)

export const processExamples = [
  ...prescriptionOrderExamples,
  ...prescriptionOrderUpdateExamples
]

export function regeneratePrescriptionIds(): void {
  const replacements = new Map<string, string>()

  prescriptionOrderExamples.forEach(processCase => {
    const bundle = processCase.request
    const firstGroupIdentifier = getMedicationRequests(bundle)[0].groupIdentifier

    const newBundleIdentifier = uuid.v4()

    const originalShortFormId = firstGroupIdentifier.value
    const newShortFormId = generateShortFormId()
    replacements.set(originalShortFormId, newShortFormId)

    const originalLongFormId = getLongFormIdExtension(firstGroupIdentifier.extension).valueIdentifier.value
    const newLongFormId = uuid.v4()
    replacements.set(originalLongFormId, newLongFormId)

    setPrescriptionIds(bundle, newBundleIdentifier, newShortFormId, newLongFormId)
  })

  prescriptionOrderUpdateExamples.forEach(processCase => {
    const bundle = processCase.request
    const firstGroupIdentifier = getMedicationRequests(bundle)[0].groupIdentifier

    const newBundleIdentifier = uuid.v4()

    const originalShortFormId = firstGroupIdentifier.value
    const newShortFormId = replacements.get(originalShortFormId)

    const originalLongFormId = getLongFormIdExtension(firstGroupIdentifier.extension).valueIdentifier.value
    const newLongFormId = replacements.get(originalLongFormId)

    setPrescriptionIds(bundle, newBundleIdentifier, newShortFormId, newLongFormId)
  })
}

export function setPrescriptionIds(
  bundle: fhir.Bundle,
  newBundleIdentifier: string,
  newShortFormId: string,
  newLongFormId: string
): void {
  bundle.identifier.value = newBundleIdentifier
  getMedicationRequests(bundle).forEach(medicationRequest => {
    const groupIdentifier = medicationRequest.groupIdentifier
    groupIdentifier.value = newShortFormId
    getLongFormIdExtension(groupIdentifier.extension).valueIdentifier.value = newLongFormId
  })
}

/**
 * The following methods contain a lot of duplicated code from the coordinator module.
 * TODO - Find a better way to share this code.
 */
export function generateShortFormId(): string {
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

function getLongFormIdExtension(extensions: Array<fhir.Extension>): fhir.IdentifierExtension {
  return extensions.find(
    extension => extension.url === "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionId"
  ) as fhir.IdentifierExtension
}

function getMedicationRequests(bundle: fhir.Bundle): Array<MedicationRequest> {
  return bundle.entry
    .filter(entry => entry.resource.resourceType === "MedicationRequest")
    .map(entry => entry.resource) as Array<MedicationRequest>
}
