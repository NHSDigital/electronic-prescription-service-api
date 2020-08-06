import {clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import {getResourcesOfType} from "../../../src/services/translation/common"
import {MedicationRequest} from "../../../src/model/fhir-resources"
import {convertCourseOfTherapyType} from "../../../src/services/translation/prescription"

function getTreatmentTypeCodeForGivenValue(code: string) {
  const bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
  const fhirMedicationRequests = getResourcesOfType(bundle, new MedicationRequest())
  const firstFhirMedicationRequest = fhirMedicationRequests[0]
  firstFhirMedicationRequest.courseOfTherapyType.coding[0].code = code
  return convertCourseOfTherapyType(firstFhirMedicationRequest).value._attributes.code
}

test('convertCourseOfTherapyType returns "0001" prescription treatment type code when first therapy type code is "acute"', () => {
  expect(getTreatmentTypeCodeForGivenValue("acute")).toEqual("0001")
})

test('convertCourseOfTherapyType returns "0002" prescription treatment type code when first therapy type code is "continuous"', () => {
  expect(getTreatmentTypeCodeForGivenValue("continuous")).toEqual("0002")
})

test('convertCourseOfTherapyType returns "0003" prescription treatment type code when first therapy type code is "continuous-repeat-dispensing"', () => {
  expect(getTreatmentTypeCodeForGivenValue("continuous-repeat-dispensing")).toEqual("0003")
})
