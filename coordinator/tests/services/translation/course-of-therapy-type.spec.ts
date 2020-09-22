import * as TestResources from "../../resources/test-resources"
import {getMedicationRequests} from "../../../src/services/translation/common/getResourcesOfType"
import {
  CourseOfTherapyTypeCode,
  getCourseOfTherapyTypeCode
} from "../../../src/services/translation/prescription/course-of-therapy-type"
import {clone} from "../../resources/test-helpers"
import {MedicationRequest} from "../../../src/models/fhir/fhir-resources"

describe("getCourseOfTherapyTypeCode", () => {
  let medicationRequests: Array<MedicationRequest>
  beforeEach(() => {
    const prescription = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    medicationRequests = getMedicationRequests(prescription)
  })

  test("returns acute for acute prescription", () => {
    medicationRequests.forEach(medicationRequest => setCourseOfTherapyTypeCode(medicationRequest, CourseOfTherapyTypeCode.ACUTE))
    const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
    expect(courseOfTherapyTypeCode).toEqual(CourseOfTherapyTypeCode.ACUTE)
  })

  test("returns continuous for repeat prescribing prescription", () => {
    medicationRequests.forEach(medicationRequest => setCourseOfTherapyTypeCode(medicationRequest, CourseOfTherapyTypeCode.CONTINUOUS))
    const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
    expect(courseOfTherapyTypeCode).toEqual(CourseOfTherapyTypeCode.CONTINUOUS)
  })

  test("returns continuous-repeat-dispensing for repeat dispensing prescription", () => {
    medicationRequests.forEach(medicationRequest => setCourseOfTherapyTypeCode(medicationRequest, CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING))
    const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
    expect(courseOfTherapyTypeCode).toEqual(CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)
  })

  test("returns acute for mixed acute / repeat prescribing prescription", () => {
    setCourseOfTherapyTypeCode(medicationRequests[0], CourseOfTherapyTypeCode.CONTINUOUS)
    setCourseOfTherapyTypeCode(medicationRequests[1], CourseOfTherapyTypeCode.CONTINUOUS)
    setCourseOfTherapyTypeCode(medicationRequests[2], CourseOfTherapyTypeCode.ACUTE)
    setCourseOfTherapyTypeCode(medicationRequests[3], CourseOfTherapyTypeCode.ACUTE)
    const courseOfTherapyTypeCode = getCourseOfTherapyTypeCode(medicationRequests)
    expect(courseOfTherapyTypeCode).toEqual(CourseOfTherapyTypeCode.ACUTE)
  })

  test("throws for mixed acute / repeat dispensing prescription", () => {
    setCourseOfTherapyTypeCode(medicationRequests[0], CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)
    setCourseOfTherapyTypeCode(medicationRequests[1], CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)
    setCourseOfTherapyTypeCode(medicationRequests[2], CourseOfTherapyTypeCode.ACUTE)
    setCourseOfTherapyTypeCode(medicationRequests[3], CourseOfTherapyTypeCode.ACUTE)
    expect(() => {
      getCourseOfTherapyTypeCode(medicationRequests)
    }).toThrow()
  })

  test("throws for mixed acute / repeat prescribing / repeat dispensing prescription", () => {
    setCourseOfTherapyTypeCode(medicationRequests[0], CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)
    setCourseOfTherapyTypeCode(medicationRequests[1], CourseOfTherapyTypeCode.CONTINUOUS)
    setCourseOfTherapyTypeCode(medicationRequests[2], CourseOfTherapyTypeCode.ACUTE)
    setCourseOfTherapyTypeCode(medicationRequests[3], CourseOfTherapyTypeCode.ACUTE)
    expect(() => {
      getCourseOfTherapyTypeCode(medicationRequests)
    }).toThrow()
  })
})

export function setCourseOfTherapyTypeCode(medicationRequest: MedicationRequest, newCourseOfTherapyTypeCode: CourseOfTherapyTypeCode): void {
  medicationRequest.courseOfTherapyType.coding.forEach(coding => coding.code = newCourseOfTherapyTypeCode)
}
