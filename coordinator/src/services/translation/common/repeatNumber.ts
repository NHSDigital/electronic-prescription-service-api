import {MedicationRequest, RepeatInformationExtension, UnsignedIntExtension} from "../../../models/fhir/fhir-resources"
import {
  getExtensionForUrl,
  getNumericValueAsNumber
} from "./index"
import {LosslessNumber} from "lossless-json"
import {Interval, NumericValue} from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import {Repeatable} from "../../../models/hl7-v3/hl7-v3-prescriptions"
import {CourseOfTherapyTypeCode, getCourseOfTherapyTypeCode} from "../prescription/course-of-therapy-type"

export function populateRepeatNumber(repeatable: Repeatable, medicationRequests: Array<MedicationRequest>): void {
  const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
  if (courseOfTherapyTypeCode === CourseOfTherapyTypeCode.CONTINUOUS) {
    repeatable.repeatNumber = createRepeatNumber("1")
  } else if (courseOfTherapyTypeCode === CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING) {
    repeatable.repeatNumber = createRepeatNumberForRepeatDispensingPrescription(medicationRequests)
  }
}

function createRepeatNumberForRepeatDispensingPrescription(medicationRequests: Array<MedicationRequest>) {
  const repeatNumberHighValues = medicationRequests.map(extractRepeatNumberHighValue)
  const maxRepeatNumberHighValue = Math.max(...repeatNumberHighValues).toString()
  return createRepeatNumber(maxRepeatNumberHighValue)
}

function extractRepeatNumberHighValue(medicationRequest: MedicationRequest): number {
  const repeatInformationExtension = getExtensionForUrl(
    medicationRequest.extension,
    "https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
    "MedicationRequest.extension"
  ) as RepeatInformationExtension
  const repeatNumberExtension = getExtensionForUrl(
    repeatInformationExtension.extension,
    "numberOfRepeatPrescriptionsAllowed",
    "MedicationRequest.extension.extension"
  ) as UnsignedIntExtension
  const repeatNumberExtensionValue = repeatNumberExtension.valueUnsignedInt
  return getNumericValueAsNumber(repeatNumberExtensionValue)
}

function createRepeatNumber(highValue: LosslessNumber | string): Interval<NumericValue> {
  return new Interval<NumericValue>(
    new NumericValue("1"),
    new NumericValue(highValue)
  )
}
