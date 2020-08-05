import {clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import {getResourcesOfType} from "../../../src/services/translation/common"
import {MedicationRequest} from "../../../src/model/fhir-resources"
import {convertCourseOfTherapyType} from "../../../src/services/translation/prescription"

test('convertCourseOfTherapyType returns "0001" prescription treatment type code when first therapy type code is "acute"', () => {
  const bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
  const fhirMedicationRequests = getResourcesOfType(bundle, new MedicationRequest())
  const firstFhirMedicationRequest = fhirMedicationRequests[0]
  firstFhirMedicationRequest.courseOfTherapyType.coding[0].code = "acute"
  const hl7v3PrescriptionTreatmentType = convertCourseOfTherapyType(firstFhirMedicationRequest)
  expect(hl7v3PrescriptionTreatmentType.value._attributes.code).toEqual("0001")
})

test('convertCourseOfTherapyType returns "0002" prescription treatment type code when first therapy type code is "continuous"', () => {
  const bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
  const fhirMedicationRequests = getResourcesOfType(bundle, new MedicationRequest())
  const firstFhirMedicationRequest = fhirMedicationRequests[0]
  firstFhirMedicationRequest.courseOfTherapyType.coding[0].code = "continuous"
  const hl7v3PrescriptionTreatmentType = convertCourseOfTherapyType(firstFhirMedicationRequest)
  expect(hl7v3PrescriptionTreatmentType.value._attributes.code).toEqual("0002")
})

test('convertCourseOfTherapyType returns "0003" prescription treatment type code when first therapy type code is "continuous-repeat-dispensing"', () => {
  const bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
  const fhirMedicationRequests = getResourcesOfType(bundle, new MedicationRequest())
  const firstFhirMedicationRequest = fhirMedicationRequests[0]
  firstFhirMedicationRequest.courseOfTherapyType.coding[0].code = "continuous-repeat-dispensing"
  const hl7v3PrescriptionTreatmentType = convertCourseOfTherapyType(firstFhirMedicationRequest)
  expect(hl7v3PrescriptionTreatmentType.value._attributes.code).toEqual("0003")
})
