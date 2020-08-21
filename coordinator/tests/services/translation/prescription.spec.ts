import {clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import {getResourcesOfType} from "../../../src/services/translation/common"
import {Bundle, CommunicationRequest, MedicationRequest} from "../../../src/model/fhir-resources"
import {convertBundleToPrescription, convertCourseOfTherapyType} from "../../../src/services/translation/prescription"

describe("convertCourseOfTherapyType", () => {
  const cases = [
    ["acute", "0001"],
    ["continuous", "0002"],
    ["continuous-repeat-dispensing", "0003"]
  ]

  test.each(cases)("when first therapy type code is %p, convertCourseOfTherapyType returns prescription treatment type code %p",
    (code: string, expected: string) => {
      const bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
      const fhirMedicationRequests = getResourcesOfType(bundle, new MedicationRequest())
      const firstFhirMedicationRequest = fhirMedicationRequests[0]
      firstFhirMedicationRequest.courseOfTherapyType.coding[0].code = code

      const treatmentTypeCode = convertCourseOfTherapyType(firstFhirMedicationRequest).value._attributes.code

      expect(treatmentTypeCode).toEqual(expected)
    })
})

describe("PertinentInformation2", () => {
  let bundle: Bundle
  let fhirCommunicationRequests: Array<CommunicationRequest>

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    fhirCommunicationRequests = createCommunicationRequestIfNone(bundle)
  })

  function createCommunicationRequestIfNone(bundle: Bundle){
    fhirCommunicationRequests = getResourcesOfType(bundle, new CommunicationRequest())
    if (fhirCommunicationRequests.length == 0) {
      const communicationRequest = new CommunicationRequest()
      communicationRequest.payload = []
      const communicationRequestEntry = {resource: communicationRequest}
      bundle.entry.push(communicationRequestEntry)
      fhirCommunicationRequests = getResourcesOfType(bundle, new CommunicationRequest())
    }
    return fhirCommunicationRequests
  }

  test("PatientInfo comes from communicationRequest and displays correctly", () => {
    const contentString = "examplePatientInfo"
    fhirCommunicationRequests[0].payload.push({contentString: contentString})
    const pertinentInformation2Array = convertBundleToPrescription(bundle).pertinentInformation2
    const firstPertinentInformation2 = pertinentInformation2Array[0]
    const additionalInstructions = firstPertinentInformation2.pertinentLineItem.pertinentInformation1.pertinentAdditionalInstructions.value
    expect(additionalInstructions).toBe(`<patientInfo>${contentString}</patientInfo>`)
  })

  test("multiple PatientInfos display correctly", () => {
    const contentString1 = "examplePatientInfo1"
    const contentString2 = "secondExamplePatientInfo"
    fhirCommunicationRequests[0].payload.push({contentString: contentString1})
    fhirCommunicationRequests[0].payload.push({contentString: contentString2})
    const pertinentInformation2Array = convertBundleToPrescription(bundle).pertinentInformation2
    const firstPertinentInformation2 = pertinentInformation2Array[0]
    const additionalInstructions = firstPertinentInformation2.pertinentLineItem.pertinentInformation1.pertinentAdditionalInstructions.value
    expect(additionalInstructions).toBe(`<patientInfo>${contentString1}</patientInfo><patientInfo>${contentString2}</patientInfo>`)
  })

  test("PatientInfo display on first LineItem only", () => {
    const contentString1 = "examplePatientInfo1"
    fhirCommunicationRequests[0].payload.push({contentString: contentString1})
    const pertinentInformation2Array = convertBundleToPrescription(bundle).pertinentInformation2
      .map((pertinentInformation2) => pertinentInformation2.pertinentLineItem.pertinentInformation1)
    expect(pertinentInformation2Array.shift()).not.toBe(undefined)
    pertinentInformation2Array.forEach((pertinentInformation1) => expect(pertinentInformation1).toBe(undefined))
  })
})
