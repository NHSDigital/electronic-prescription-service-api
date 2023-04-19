import * as TestResources from "../../../resources/test-resources"
import {getMedicationRequests} from "../../../../src/services/translation/common/getResourcesOfType"
import {getCourseOfTherapyTypeCode} from "../../../../src/services/translation/request/course-of-therapy-type"
import {clone} from "../../../resources/test-helpers"
import {fhir} from "@models"

describe("getCourseOfTherapyTypeCode", () => {
  let medicationRequests: Array<fhir.MedicationRequest>
  beforeEach(() => {
    const prescription = clone(TestResources.specification[0].fhirMessageUnsigned)
    medicationRequests = getMedicationRequests(prescription)
  })

  test("returns acute for acute prescription", () => {
    medicationRequests.forEach((medicationRequest) =>
      setCourseOfTherapyTypeCode(medicationRequest, fhir.CourseOfTherapyTypeCode.ACUTE)
    )
    const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
    expect(courseOfTherapyTypeCode).toEqual(fhir.CourseOfTherapyTypeCode.ACUTE)
  })

  test("returns continuous for repeat prescribing prescription", () => {
    medicationRequests.forEach((medicationRequest) =>
      setCourseOfTherapyTypeCode(medicationRequest, fhir.CourseOfTherapyTypeCode.CONTINUOUS)
    )
    const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
    expect(courseOfTherapyTypeCode).toEqual(fhir.CourseOfTherapyTypeCode.CONTINUOUS)
  })

  test("returns continuous-repeat-dispensing for repeat dispensing prescription", () => {
    medicationRequests.forEach((medicationRequest) =>
      setCourseOfTherapyTypeCode(medicationRequest, fhir.CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)
    )
    const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
    expect(courseOfTherapyTypeCode).toEqual(fhir.CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)
  })

  test("returns acute for mixed acute / repeat prescribing prescription", () => {
    setCourseOfTherapyTypeCode(medicationRequests[0], fhir.CourseOfTherapyTypeCode.CONTINUOUS)
    setCourseOfTherapyTypeCode(medicationRequests[1], fhir.CourseOfTherapyTypeCode.CONTINUOUS)
    setCourseOfTherapyTypeCode(medicationRequests[2], fhir.CourseOfTherapyTypeCode.ACUTE)
    setCourseOfTherapyTypeCode(medicationRequests[3], fhir.CourseOfTherapyTypeCode.ACUTE)
    const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
    expect(courseOfTherapyTypeCode).toEqual(fhir.CourseOfTherapyTypeCode.ACUTE)
  })

  test("throws for mixed acute / repeat dispensing prescription", () => {
    setCourseOfTherapyTypeCode(medicationRequests[0], fhir.CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)
    setCourseOfTherapyTypeCode(medicationRequests[1], fhir.CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)
    setCourseOfTherapyTypeCode(medicationRequests[2], fhir.CourseOfTherapyTypeCode.ACUTE)
    setCourseOfTherapyTypeCode(medicationRequests[3], fhir.CourseOfTherapyTypeCode.ACUTE)
    expect(() => {
      getCourseOfTherapyTypeCode(medicationRequests)
    }).toThrow()
  })

  test("throws for mixed acute / repeat prescribing / repeat dispensing prescription", () => {
    setCourseOfTherapyTypeCode(medicationRequests[0], fhir.CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)
    setCourseOfTherapyTypeCode(medicationRequests[1], fhir.CourseOfTherapyTypeCode.CONTINUOUS)
    setCourseOfTherapyTypeCode(medicationRequests[2], fhir.CourseOfTherapyTypeCode.ACUTE)
    setCourseOfTherapyTypeCode(medicationRequests[3], fhir.CourseOfTherapyTypeCode.ACUTE)
    expect(() => {
      getCourseOfTherapyTypeCode(medicationRequests)
    }).toThrow()
  })
})

export function setCourseOfTherapyTypeCode(
  medicationRequest: fhir.MedicationRequest,
  newCourseOfTherapyTypeCode: fhir.CourseOfTherapyTypeCode
): void {
  medicationRequest.courseOfTherapyType.coding.forEach((coding) => (coding.code = newCourseOfTherapyTypeCode))
}
