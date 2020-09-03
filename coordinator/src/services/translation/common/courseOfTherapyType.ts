import * as fhir from "../../../model/fhir-resources"
import {onlyElement} from "./index"

export enum CourseOfTherapyTypeCode {
  ACUTE = "acute",
  CONTINUOUS = "continuous",
  CONTINUOUS_REPEAT_DISPENSING = "continuous-repeat-dispensing"
}

export function getCourseOfTherapyTypeCode(fhirMedicationRequest: fhir.MedicationRequest): string {
  return fhirMedicationRequest.courseOfTherapyType.coding
    .map(coding => coding.code)
    .reduce(onlyElement)
}
