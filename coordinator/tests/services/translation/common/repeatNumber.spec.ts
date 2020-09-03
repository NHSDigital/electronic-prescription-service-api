import {populateRepeatNumber} from "../../../../src/services/translation/common/repeatNumber"
import {clone} from "../../../resources/test-helpers"
import * as TestResources from "../../../resources/test-resources"
import {getMedicationRequests} from "../../../../src/services/translation/common/getResourcesOfType"
import {CourseOfTherapyTypeCode} from "../../../../src/services/translation/common/courseOfTherapyType"
import {
  MedicationRequest,
  RepeatInformationExtension,
  UnsignedIntExtension
} from "../../../../src/model/fhir-resources"
import {Repeatable} from "../../../../src/model/hl7-v3-prescriptions"
import {getExtensionForUrl} from "../../../../src/services/translation/common"
import {LosslessNumber} from "lossless-json"

describe("populateRepeatNumber", () => {
  let medicationRequests: Array<MedicationRequest>
  let repeatable: Repeatable
  beforeEach(() => {
    const prescription = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    medicationRequests = getMedicationRequests(prescription)
    repeatable = {
      repeatNumber: null
    }
  })

  test("does nothing for acute prescriptions", () => {
    setCourseOfTherapyTypeCode(medicationRequests, CourseOfTherapyTypeCode.ACUTE)

    populateRepeatNumber(repeatable, medicationRequests)

    expect(repeatable.repeatNumber).toBeNull()
  })

  test("sets 1-1 for repeat prescribing prescriptions", () => {
    setCourseOfTherapyTypeCode(medicationRequests, CourseOfTherapyTypeCode.CONTINUOUS)

    populateRepeatNumber(repeatable, medicationRequests)

    expect(repeatable.repeatNumber?.low?._attributes?.value).toEqual("1")
    expect(repeatable.repeatNumber?.high?._attributes?.value).toEqual("1")
  })

  test("sets 1-X for repeat dispensing prescriptions with consistent repeat numbers", () => {
    setCourseOfTherapyTypeCode(medicationRequests, CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)

    populateRepeatNumber(repeatable, medicationRequests)

    expect(repeatable.repeatNumber?.low?._attributes?.value).toEqual("1")
    expect(repeatable.repeatNumber?.high?._attributes?.value).toEqual("6")
  })

  test("sets 1-max(X) for repeat dispensing prescriptions with different repeat numbers", () => {
    setRepeatNumber(medicationRequests[0], "6")
    setRepeatNumber(medicationRequests[1], "6")
    setRepeatNumber(medicationRequests[2], "12")
    setRepeatNumber(medicationRequests[3], "6")
    setCourseOfTherapyTypeCode(medicationRequests, CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)

    populateRepeatNumber(repeatable, medicationRequests)

    expect(repeatable.repeatNumber?.low?._attributes?.value).toEqual("1")
    expect(repeatable.repeatNumber?.high?._attributes?.value).toEqual("12")
  })
})

function setCourseOfTherapyTypeCode(medicationRequests: Array<MedicationRequest>, newCourseOfTherapyTypeCode: CourseOfTherapyTypeCode) {
  medicationRequests
    .flatMap(medicationRequest => medicationRequest.courseOfTherapyType.coding)
    .forEach(coding => coding.code = newCourseOfTherapyTypeCode)
}

function setRepeatNumber(medicationRequest: MedicationRequest, newRepeatNumber: LosslessNumber | string) {
  const repeatInformationExtension = getExtensionForUrl(medicationRequest.extension, "https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation") as RepeatInformationExtension
  const repeatNumberExtension = getExtensionForUrl(repeatInformationExtension.extension, "numberOfRepeatPrescriptionsAllowed") as UnsignedIntExtension
  repeatNumberExtension.valueUnsignedInt = newRepeatNumber
}
