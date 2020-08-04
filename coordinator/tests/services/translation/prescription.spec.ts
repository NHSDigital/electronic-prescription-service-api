import {clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import {getResourcesOfType} from "../../../src/services/translation/common"
import {MedicationRequest} from "../../../src/model/fhir-resources"
import {convertCourseOfTherapyType} from "../../../src/services/translation/prescription"

test('convertCourseOfTherapyType returns "0001" prescription treatment type code when first therapy type code is "acute"', () => {
  const bundle2 = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
  const fhirMedicationRequests = getResourcesOfType(bundle2, new MedicationRequest())
  const firstFhirMedicationRequest = fhirMedicationRequests[0]
  firstFhirMedicationRequest.courseOfTherapyType.coding[0].code = "acute"
  const prescriptionTreatmentType = convertCourseOfTherapyType(firstFhirMedicationRequest)
  expect(prescriptionTreatmentType.value._attributes.code).toEqual("0001")
})

test('convertCourseOfTherapyType returns "0002" prescription treatment type code when first therapy type code is "repeat"', () => {
  const bundle2 = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
  const fhirMedicationRequests = getResourcesOfType(bundle2, new MedicationRequest())
  const firstFhirMedicationRequest = fhirMedicationRequests[0]
  firstFhirMedicationRequest.courseOfTherapyType.coding[0].code = "repeat"
  const prescriptionTreatmentType = convertCourseOfTherapyType(firstFhirMedicationRequest)
  expect(prescriptionTreatmentType.value._attributes.code).toEqual("0002")
})

test('convertCourseOfTherapyType returns "0003" prescription treatment type code when first therapy type code is "repeat-dispensing"', () => {
  const bundle2 = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
  const fhirMedicationRequests = getResourcesOfType(bundle2, new MedicationRequest())
  const firstFhirMedicationRequest = fhirMedicationRequests[0]
  firstFhirMedicationRequest.courseOfTherapyType.coding[0].code = "repeat-dispensing"
  const prescriptionTreatmentType = convertCourseOfTherapyType(firstFhirMedicationRequest)
  expect(prescriptionTreatmentType.value._attributes.code).toEqual("0003")
})
