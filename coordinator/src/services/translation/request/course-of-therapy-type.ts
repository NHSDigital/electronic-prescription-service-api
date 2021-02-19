import {InvalidValueError} from "../../../models/errors/processing-errors"
import {CourseOfTherapyTypeCode, MedicationRequest} from "../../../models/fhir/medication-request"

export function getCourseOfTherapyTypeCode(medicationRequests: Array<MedicationRequest>): string {
  const codeList = medicationRequests
    .flatMap(medicationRequest => medicationRequest.courseOfTherapyType.coding)
    .map(coding => coding.code)
  const codeSet = new Set(codeList)
  if (isSingleCourseOfTherapyType(codeSet)) {
    return codeSet.values().next().value
  } else if (isMixedAcuteAndContinuousCourseOfTherapyType(codeSet)) {
    return CourseOfTherapyTypeCode.ACUTE
  } else {
    throw new InvalidValueError(
      `Course of therapy type must either match for all MedicationRequests or be a mixture of '${
        CourseOfTherapyTypeCode.ACUTE
      }' and '${
        CourseOfTherapyTypeCode.CONTINUOUS
      }'.`,
      "MedicationRequest.courseOfTherapyType.coding"
    )
  }
}

function isSingleCourseOfTherapyType(codeSet: Set<string>) {
  return codeSet.size === 1
}

function isMixedAcuteAndContinuousCourseOfTherapyType(codeSet: Set<string>) {
  return codeSet.size === 2
    && codeSet.has(CourseOfTherapyTypeCode.ACUTE)
    && codeSet.has(CourseOfTherapyTypeCode.CONTINUOUS)
}
