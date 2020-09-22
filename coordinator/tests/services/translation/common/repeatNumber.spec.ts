import {populateRepeatNumber} from "../../../../src/services/translation/common/repeatNumber"
import {clone} from "../../../resources/test-helpers"
import * as TestResources from "../../../resources/test-resources"
import {getMedicationRequests} from "../../../../src/services/translation/common/getResourcesOfType"
import {CourseOfTherapyTypeCode} from "../../../../src/services/translation/prescription/course-of-therapy-type"
import {
  MedicationRequest,
  RepeatInformationExtension,
  UnsignedIntExtension
} from "../../../../src/models/fhir/fhir-resources"
import {Repeatable} from "../../../../src/models/hl7-v3/hl7-v3-prescriptions"
import {getExtensionForUrl} from "../../../../src/services/translation/common"
import {LosslessNumber} from "lossless-json"
import {setCourseOfTherapyTypeCode} from "../course-of-therapy-type.spec"

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
    medicationRequests.forEach(medicationRequest =>
      setCourseOfTherapyTypeCode(medicationRequest, CourseOfTherapyTypeCode.ACUTE)
    )

    populateRepeatNumber(repeatable, medicationRequests)

    expect(repeatable.repeatNumber).toBeNull()
  })

  test("does nothing for mixed acute / repeat prescribing prescriptions", () => {
    setCourseOfTherapyTypeCode(medicationRequests[0], CourseOfTherapyTypeCode.CONTINUOUS)
    setCourseOfTherapyTypeCode(medicationRequests[1], CourseOfTherapyTypeCode.CONTINUOUS)
    setCourseOfTherapyTypeCode(medicationRequests[2], CourseOfTherapyTypeCode.ACUTE)
    setCourseOfTherapyTypeCode(medicationRequests[3], CourseOfTherapyTypeCode.ACUTE)

    populateRepeatNumber(repeatable, medicationRequests)

    expect(repeatable.repeatNumber).toBeNull()
  })

  test("sets 1-1 for repeat prescribing prescriptions", () => {
    medicationRequests.forEach(medicationRequest =>
      setCourseOfTherapyTypeCode(medicationRequest, CourseOfTherapyTypeCode.CONTINUOUS)
    )

    populateRepeatNumber(repeatable, medicationRequests)

    expect(repeatable.repeatNumber?.low?._attributes?.value).toEqual("1")
    expect(repeatable.repeatNumber?.high?._attributes?.value).toEqual("1")
  })

  test("sets 1-X for repeat dispensing prescriptions with consistent repeat numbers X", () => {
    medicationRequests.forEach(medicationRequest =>
      setCourseOfTherapyTypeCode(medicationRequest, CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)
    )

    populateRepeatNumber(repeatable, medicationRequests)

    expect(repeatable.repeatNumber?.low?._attributes?.value).toEqual("1")
    expect(repeatable.repeatNumber?.high?._attributes?.value).toEqual("6")
  })

  test("sets 1-max(X) for repeat dispensing prescriptions with different repeat numbers X", () => {
    setRepeatNumber(medicationRequests[0], "6")
    setRepeatNumber(medicationRequests[1], "6")
    setRepeatNumber(medicationRequests[2], "12")
    setRepeatNumber(medicationRequests[3], "6")
    medicationRequests.forEach(medicationRequest =>
      setCourseOfTherapyTypeCode(medicationRequest, CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)
    )

    populateRepeatNumber(repeatable, medicationRequests)

    expect(repeatable.repeatNumber?.low?._attributes?.value).toEqual("1")
    expect(repeatable.repeatNumber?.high?._attributes?.value).toEqual("12")
  })
})

function setRepeatNumber(medicationRequest: MedicationRequest, newRepeatNumber: LosslessNumber | string) {
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
  repeatNumberExtension.valueUnsignedInt = newRepeatNumber
}
