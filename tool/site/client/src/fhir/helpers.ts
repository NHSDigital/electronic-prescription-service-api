import * as fhir from "fhir/r4"
import {
  getLongFormIdExtension,
  getUkCoreNumberOfRepeatsIssuedExtension,
  RepeatInformationExtension
} from "./customExtensions"
import * as uuid from "uuid"
import {COURSE_OF_THERAPY_TYPE_CODES} from "./reference-data/valueSets"
import {getMedicationRequestResources} from "./bundleResourceFinder"
import {generateShortFormIdFromExisting} from "./generatePrescriptionIds"
import {convertMomentToISODate} from "../formatters/dates"
import * as moment from "moment"

export function getMedicationRequestLineItemId(medicationRequest: fhir.MedicationRequest): string {
  return medicationRequest.identifier[0].value
}

export function getMedicationDispenseLineItemId(medicationDispense: fhir.MedicationDispense): string {
  return medicationDispense.authorizingPrescription[0].identifier.value
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

export function createDispensingRepeatInformationExtension(medicationRequest: fhir.MedicationRequest): RepeatInformationExtension {
  const [repeatsIssued, repeatsAllowed] = getRepeatsIssuedAndAllowed(medicationRequest)
  return {
    url: "https://fhir.nhs.uk/StructureDefinition/Extension-EPS-RepeatInformation",
    extension: [
      {
        url: "numberOfRepeatsIssued",
        valueInteger: repeatsIssued
      },
      {
        url: "numberOfRepeatsAllowed",
        valueInteger: repeatsAllowed
      }
    ]
  }
}

export function getRepeatsIssuedAndAllowed(medicationRequest: fhir.MedicationRequest): [number, number] {
  const ukCoreRepeatsIssuedExtension = getUkCoreNumberOfRepeatsIssuedExtension(medicationRequest.extension)
  const numberOfRepeatPrescriptionsIssued = ukCoreRepeatsIssuedExtension
    ? ukCoreRepeatsIssuedExtension.valueUnsignedInt
    : 1
  const numberOfRepeatPrescriptionsAllowed = (medicationRequest.dispenseRequest?.numberOfRepeatsAllowed || 0) + 1
  return [numberOfRepeatPrescriptionsIssued, numberOfRepeatPrescriptionsAllowed]
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

export function updateValidityPeriod(bundle: fhir.Bundle) {
  const medicationRequests = bundle.entry
    .map(entry => entry.resource)
    .filter(resource => resource.resourceType === "MedicationRequest") as Array<fhir.MedicationRequest>
  const start = convertMomentToISODate(moment.utc())
  const end = convertMomentToISODate(moment.utc().add(1, "month"))
  medicationRequests.forEach(medicationRequest => {
    const validityPeriod = medicationRequest.dispenseRequest.validityPeriod
    if (validityPeriod) {
      validityPeriod.start = start
      validityPeriod.end = end
    }
  })
}



export function isRepeatDispensing(bundle: fhir.Bundle): boolean {
  return getMedicationRequestResources(bundle)
    .flatMap(medicationRequest => medicationRequest.courseOfTherapyType.coding)
    .some(coding => coding.code === "continuous-repeat-dispensing")
}
