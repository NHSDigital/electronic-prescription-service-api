import {ProcessCase} from "../cases/process-case"
import {exampleFiles} from "./example-files-fetcher"
import * as uuid from "uuid"
import * as fhir from "../fhir"

const processRequestFiles = exampleFiles.filter(exampleFile => exampleFile.isRequest && exampleFile.endpoint === "process")
const prescriptionOrderFiles = processRequestFiles.filter(exampleFile => exampleFile.operation === "send")
const prescriptionOrderUpdateFiles = processRequestFiles.filter(exampleFile => exampleFile.operation === "cancel")
const prescriptionDispenseFiles = processRequestFiles.filter(exampleFile => exampleFile.operation === "dispense")
const prescriptionOrderExamples: ProcessCase[] = prescriptionOrderFiles.map(processRequestFile =>
  new ProcessCase(processRequestFile, null)
)
const prescriptionOrderUpdateExamples: ProcessCase[] = prescriptionOrderUpdateFiles.map(processRequestFile =>
  new ProcessCase(processRequestFile, null)
)
const prescriptionDispenseExamples: ProcessCase[] = prescriptionDispenseFiles.map(processRequestFile =>
  new ProcessCase(processRequestFile, null)
)

export const processExamples = [
  ...prescriptionOrderExamples,
  ...prescriptionOrderUpdateExamples,
  ...prescriptionDispenseExamples
]

export function updatePrescriptions(): void {
  const replacements = new Map<string, string>()

  prescriptionOrderExamples.forEach(processCase => {
    const bundle = processCase.request
    const firstGroupIdentifier = getMedicationRequests(bundle)[0].groupIdentifier

    const newBundleIdentifier = uuid.v4()

    const originalShortFormId = firstGroupIdentifier.value
    const newShortFormId = generateShortFormId(originalShortFormId)
    replacements.set(originalShortFormId, newShortFormId)

    const originalLongFormId = getLongFormIdExtension(firstGroupIdentifier.extension).valueIdentifier.value
    const newLongFormId = uuid.v4()
    replacements.set(originalLongFormId, newLongFormId)

    setPrescriptionIds(bundle, newBundleIdentifier, newShortFormId, newLongFormId)
    setTestPatientIfProd(bundle)
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
    setTestPatientIfProd(bundle)
  })
}

function setTestPatientIfProd(bundle: fhir.Bundle) {
  if (process.env.APIGEE_ENVIRONMENT === "prod") {
    const patient = getPatient(bundle)
    const nhsNumberIdentifier = getNhsNumberIdentifier(patient)
    nhsNumberIdentifier.value = "9990548609"
    patient.name = [
      {
        "use": "usual",
        "family": "XXTESTPATIENT-TGNP",
        "given": [
          "DONOTUSE"
        ],
        "prefix": [
          "MR"
        ]
      }
    ]
    patient.gender = "male"
    patient.birthDate = "1932-01-06",
    patient.address = [
      {
        "use": "home",
        "line": [
          "1 Trevelyan Square",
          "Boar Lane",
          "Leeds",
          "West Yorkshire"
        ],
        "postalCode": "LS1 6AE"
      }
    ]
  }
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
export function generateShortFormId(originalShortFormId?: string): string {
  const _PRESC_CHECKDIGIT_VALUES = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+"
  const hexString = (uuid.v4()).replace(/-/g, "").toUpperCase()
  let prescriptionID = `${hexString.substring(0, 6)}-${originalShortFormId?.substring(7,13) ?? "A12345"}-${hexString.substring(12, 17)}`
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

function getMedicationRequests(bundle: fhir.Bundle): Array<fhir.MedicationRequest> {
  return bundle.entry
    .filter(entry => entry.resource.resourceType === "MedicationRequest")
    .map(entry => entry.resource) as Array<fhir.MedicationRequest>
}

function getPatient(bundle: fhir.Bundle): fhir.Patient {
  return bundle.entry
    .filter(entry => entry.resource.resourceType === "Patient")
    .map(entry => entry.resource)[0] as fhir.Patient
}

function getNhsNumberIdentifier(fhirPatient: fhir.Patient) {
  return fhirPatient
    .identifier
    .filter(identifier => identifier.system === "https://fhir.nhs.uk/Id/nhs-number")[0]
}