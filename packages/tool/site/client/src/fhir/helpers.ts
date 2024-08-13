import * as fhir from "fhir/r4"
import {
  getEpsNumberOfRepeatsAllowedExtension,
  getLongFormIdExtension,
  getUkCoreNumberOfRepeatsIssuedExtension,
  RepeatInformationExtension,
  URL_EPS_NUMBER_OF_REPEATS_ALLOWED,
  URL_NUMBER_OF_REPEATS_ISSUED
} from "./customExtensions"
import * as uuid from "uuid"
import {COURSE_OF_THERAPY_TYPE_CODES} from "./reference-data/valueSets"
import {getMedicationRequestResources} from "./bundleResourceFinder"
import {generateShortFormIdFromExisting} from "./generatePrescriptionIds"
import {convertMomentToISODate} from "../formatters/dates"
import moment from "moment"

export interface MedicationDispense extends fhir.MedicationDispense {
  contained: Array<MedicationRequest | fhir.PractitionerRole>
}

export interface MedicationRequest extends fhir.MedicationRequest{
  identifier: Array<fhir.Identifier>
  groupIdentifier: fhir.Identifier
}

export function getMedicationRequestLineItemId(medicationRequest: fhir.MedicationRequest): string {
  return medicationRequest.identifier[0].value
}

export function getMedicationDispenseLineItemId(medicationDispense: MedicationDispense): string {
  const containedMedicationRequest = medicationDispense.contained
    ?.find(resource => resource?.resourceType === "MedicationRequest") as MedicationRequest
  return containedMedicationRequest.identifier[0].value
}

export function getMedicationDispenseId(medicationDispense: fhir.MedicationDispense): string {
  return medicationDispense.identifier[0].value
}

export function getTotalQuantity(quantities: Array<fhir.Quantity>): fhir.Quantity {
  const units = quantities.map(quantity => quantity.unit)
  const values = quantities.map(quantity => quantity.value)
  if (new Set(units).size > 1) {
    throw new Error("Attempting to consolidate quantities with mismatched units")
  }
  return {
    ...quantities[0],
    value: values.reduce((a, b) => a + b)
  }
}

export function createIdentifier(): fhir.Identifier {
  return {
    system: "https://tools.ietf.org/html/rfc4122",
    value: uuid.v4()
  }
}

export function requiresDispensingRepeatInformationExtension(medicationRequest: fhir.MedicationRequest): boolean {
  return medicationRequest.courseOfTherapyType.coding[0].code !== COURSE_OF_THERAPY_TYPE_CODES.ACUTE
}

// eslint-disable-next-line max-len
export function createDispensingRepeatInformationExtension(medicationRequest: fhir.MedicationRequest): RepeatInformationExtension {
  const [currentIssueNumber, endIssueNumber] = getCurrentIssueNumberAndEndIssueNumber(medicationRequest)
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
    extension: [
      {
        url: URL_NUMBER_OF_REPEATS_ISSUED,
        valueInteger: currentIssueNumber - 1
      },
      {
        url: URL_EPS_NUMBER_OF_REPEATS_ALLOWED,
        valueInteger: endIssueNumber - 1
      }
    ]
  }
}

export function getCurrentIssueNumberAndEndIssueNumber(medicationRequest: fhir.MedicationRequest): [number, number] {
  const ukCoreRepeatsIssuedExtension = getUkCoreNumberOfRepeatsIssuedExtension(medicationRequest.extension)

  const currentIssueNumber = (ukCoreRepeatsIssuedExtension ? ukCoreRepeatsIssuedExtension.valueUnsignedInt : 0) + 1
  const endIssueNumber = getEndIssueNumber(medicationRequest)

  return [currentIssueNumber, endIssueNumber]
}

function getEndIssueNumber(medicationRequest: fhir.MedicationRequest): number {
  if (medicationRequest.basedOn?.length) {
    return getEpsNumberOfRepeatsAllowedExtension(medicationRequest.basedOn[0].extension).valueInteger + 1
  } else if (medicationRequest.dispenseRequest?.numberOfRepeatsAllowed) {
    return medicationRequest.dispenseRequest?.numberOfRepeatsAllowed + 1
  } else {
    return 1
  }
}

export function updateBundleIds(bundle: fhir.Bundle): void {
  const firstGroupIdentifier = getMedicationRequestResources(bundle)[0].groupIdentifier
  const originalShortFormId = firstGroupIdentifier.value

  const newShortFormId = generateShortFormIdFromExisting(originalShortFormId)
  const newLongFormId = uuid.v4()

  bundle.identifier.value = uuid.v4()
  getMedicationRequestResources(bundle).forEach(medicationRequest => {
    medicationRequest.identifier[0].value = uuid.v4()
    const groupIdentifier = medicationRequest.groupIdentifier
    groupIdentifier.value = newShortFormId
    getLongFormIdExtension(groupIdentifier.extension).valueIdentifier.value = newLongFormId
  })
}

export function updateValidityPeriod(bundle: fhir.Bundle): void {
  const start = convertMomentToISODate(moment.utc())
  getMedicationRequestResources(bundle).forEach(medicationRequest => {
    const validityPeriod = medicationRequest.dispenseRequest?.validityPeriod
    if (validityPeriod) {
      const oldStart = moment.utc(validityPeriod.start)
      const isExpired = oldStart < moment.utc()
      if (isExpired) {
        validityPeriod.start = start
        validityPeriod.end = convertMomentToISODate(moment.utc().add(1, "month"))
      }
    }
  })
}

export function isRepeatDispensing(bundle: fhir.Bundle): boolean {
  return getMedicationRequestResources(bundle)
    .flatMap(medicationRequest => medicationRequest.courseOfTherapyType.coding)
    .some(coding => coding.code === "continuous-repeat-dispensing")
}

export function orderBundleResources(r1: fhir.Resource, r2: fhir.Resource): number {
  return getSortIndex(r1) - getSortIndex(r2)
}

function getSortIndex(resource: fhir.Resource) {
  switch (resource.resourceType) {
    case "MessageHeader":
      return 0
    case "MedicationRequest":
      return 1
    case "Patient":
      return 2
    case "Practitioner":
      return 3
    case "PractitionerRole":
      return 4
    case "Organization":
      return 5
    case "HealthcareService":
      return 6
    case "Location":
      return 7
    case "Provenance":
      return 8
    default:
      return 0
  }
}
