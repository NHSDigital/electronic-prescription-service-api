import {MedicationRequest} from "../../../model/fhir-resources"

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
  if (codeSet.size === 1) {
    return codeSet.values().next().value
  } else if (codeSet.size === 2 && codeSet.has(CourseOfTherapyTypeCode.ACUTE) && codeSet.has(CourseOfTherapyTypeCode.CONTINUOUS)) {
    return CourseOfTherapyTypeCode.ACUTE
  } else {
    throw new TypeError("Course of therapy type must either match for all MedicationRequests or be a mixture of acute and continuous")
  }
}
