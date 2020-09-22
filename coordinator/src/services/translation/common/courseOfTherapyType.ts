import {MedicationRequest} from "../../../model/fhir-resources"
import {InvalidValueError} from "../../../model/errors"

export enum CourseOfTherapyTypeCode {
  ACUTE = "acute",
  CONTINUOUS = "continuous",
  CONTINUOUS_REPEAT_DISPENSING = "continuous-repeat-dispensing"
}

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
