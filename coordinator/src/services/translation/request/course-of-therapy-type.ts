import {InvalidValueError} from "../../../models/errors/processing-errors"
import * as fhir from "../../../models/fhir"

export function getCourseOfTherapyTypeCode(medicationRequests: Array<fhir.MedicationRequest>): string {
  const codeList = medicationRequests
    .flatMap(medicationRequest => medicationRequest.courseOfTherapyType.coding)
    .map(coding => coding.code)
  const codeSet = new Set(codeList)
  if (isSingleCourseOfTherapyType(codeSet)) {
    return codeSet.values().next().value
  } else if (isMixedAcuteAndContinuousCourseOfTherapyType(codeSet)) {
    return fhir.CourseOfTherapyTypeCode.ACUTE
  } else {
    throw new InvalidValueError(
      `Course of therapy type must either match for all MedicationRequests or be a mixture of '${
        fhir.CourseOfTherapyTypeCode.ACUTE
      }' and '${
        fhir.CourseOfTherapyTypeCode.CONTINUOUS
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
    && codeSet.has(fhir.CourseOfTherapyTypeCode.ACUTE)
    && codeSet.has(fhir.CourseOfTherapyTypeCode.CONTINUOUS)
}
