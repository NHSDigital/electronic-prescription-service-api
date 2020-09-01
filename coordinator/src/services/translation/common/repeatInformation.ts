import {MedicationRequest, RepeatInformationExtension, UnsignedIntExtension} from "../../../model/fhir-resources"
import {
  getCourseOfTherapyTypeCode,
  getExtensionForUrl,
  getExtensionForUrlOrNull,
  getNumericValueAsNumber
} from "./index"
import {LosslessNumber} from "lossless-json"
import {IntervalComplete, NumericValue} from "../../../model/hl7-v3-datatypes-core"
import {Repeatable} from "../../../model/hl7-v3-prescriptions"

export function populateRepeatNumber(repeatable: Repeatable, medicationRequests: Array<MedicationRequest>): void {
  const repeatNumber = createRepeatNumberForMedicationRequests(medicationRequests)
  if (repeatNumber) {
    repeatable.repeatNumber = repeatNumber
  }
}

export function getRepeatInformation(medicationRequests: Array<MedicationRequest>): Array<RepeatInformationExtension> {
  return medicationRequests
    .map(medicationRequest => getExtensionForUrlOrNull(medicationRequest.extension, "https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation") as RepeatInformationExtension)
    .filter(Boolean)
}

export function createRepeatNumberForMedicationRequests(medicationRequests: Array<MedicationRequest>): IntervalComplete<NumericValue> {
  const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests[0])
  if (courseOfTherapyTypeCode === "continuous") {
    return createRepeatNumber("1")
  } else if (courseOfTherapyTypeCode === "continuous-repeat-dispensing") {
    const repeatInformation = getRepeatInformation(medicationRequests)
    const repeatNumberHighValues = repeatInformation.map(extractRepeatNumberHighValue)
    const maxRepeatNumberHighValue = Math.max(...repeatNumberHighValues).toString()
    return createRepeatNumber(maxRepeatNumberHighValue)
  } else {
    return null
  }
}

function createRepeatNumber(highValue: LosslessNumber | string): IntervalComplete<NumericValue> {
  return new IntervalComplete<NumericValue>(
    new NumericValue("1"),
    new NumericValue(highValue)
  )
}

export function extractRepeatNumberHighValue(repeatInformationExtension: RepeatInformationExtension): number {
  const extension = getExtensionForUrl(repeatInformationExtension.extension, "numberOfRepeatPrescriptionsAllowed") as UnsignedIntExtension
  const extensionValue = extension.valueUnsignedInt
  return getNumericValueAsNumber(extensionValue)
}
