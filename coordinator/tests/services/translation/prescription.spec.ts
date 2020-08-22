import {clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import {getResourcesOfType} from "../../../src/services/translation/common"
import {Bundle, CommunicationRequest, MedicationRequest} from "../../../src/model/fhir-resources"
import {convertBundleToPrescription, convertCourseOfTherapyType} from "../../../src/services/translation/prescription"
import * as translator from "../../../src/services/translation/translation-service"
import {LineItemPertinentInformation1} from "../../../src/model/hl7-v3-prescriptions";

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
    bundle = getBundleWithEmptyCommunicationRequestAndAtLeast2MedicationRequests()
    fhirCommunicationRequests = getResourcesOfType(bundle, new CommunicationRequest())
  })

  function getBundleWithEmptyCommunicationRequestAndAtLeast2MedicationRequests() {
    const result = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    result.entry = result.entry.filter((entry) => entry.resource.resourceType !== "CommunicationRequest")
    addEmptyCommunicationRequestToBundle(result)
    ensureAtLeast2MedicationRequests(result)
    return result
  }

  function ensureAtLeast2MedicationRequests(bundle: Bundle) {
    const fhirMedicationRequests = getResourcesOfType(bundle, new MedicationRequest())
    if (fhirMedicationRequests.length == 1)
      bundle.entry.push({resource: fhirMedicationRequests[0]})
  }

  function addEmptyCommunicationRequestToBundle(bundle: Bundle) {
    const communicationRequest = new CommunicationRequest()
    communicationRequest.payload = []
    bundle.entry.push({resource: communicationRequest})
  }

  test("PatientInfo comes from communicationRequest and displays correctly", () => {
    const contentString = "examplePatientInfo"
    fhirCommunicationRequests[0].payload.push({contentString: contentString})

    const pertinentInformation2Array = convertBundleToPrescription(bundle).pertinentInformation2

    const firstPertinentInformation2 = pertinentInformation2Array[0]
    const additionalInstructions = firstPertinentInformation2.pertinentLineItem.pertinentInformation1.pertinentAdditionalInstructions.value
    const expected = `<patientInfo>${contentString}</patientInfo>`
    expect(additionalInstructions).toContain(expected)
  })

  test("multiple PatientInfos display correctly", () => {
    const contentString1 = "examplePatientInfo1"
    const contentString2 = "secondExamplePatientInfo"
    fhirCommunicationRequests[0].payload.push({contentString: contentString1}, {contentString: contentString2})

    const pertinentInformation2Array = convertBundleToPrescription(bundle).pertinentInformation2

    const firstPertinentInformation2 = pertinentInformation2Array[0]
    const additionalInstructions = firstPertinentInformation2.pertinentLineItem.pertinentInformation1.pertinentAdditionalInstructions.value
    expect(additionalInstructions).toContain(`<patientInfo>${contentString1}</patientInfo><patientInfo>${contentString2}</patientInfo>`)
  })

  test("PatientInfo display on first LineItem only", () => {
    const contentString = "examplePatientInfo1"
    const expected = `<patientInfo>${contentString}</patientInfo>`
    fhirCommunicationRequests[0].payload.push({contentString: contentString})

    const pertinentInformation2Array = convertBundleToPrescription(bundle).pertinentInformation2
      .map((pertinentInformation2) => pertinentInformation2.pertinentLineItem.pertinentInformation1)

    const firstPertinentInformation1 = pertinentInformation2Array.shift()
    expect(firstPertinentInformation1.pertinentAdditionalInstructions.value).toContain(expected)

    pertinentInformation2Array.forEach((pertinentInformation1) => checkValueDoesNotContainExpected(pertinentInformation1))

    function checkValueDoesNotContainExpected(pertinentInformation1: LineItemPertinentInformation1) {
      const actual = pertinentInformation1?.pertinentAdditionalInstructions?.value
      if (actual)
        expect(actual).not.toContain(expected)
    }
  })

  test("additionalInfo XML escaped after final conversion", () => {
    const contentString1 = "examplePatientInfo1"
    fhirCommunicationRequests[0].payload.push({contentString: contentString1})

    const result = translator.convertFhirMessageToHl7V3ParentPrescriptionMessage(bundle)
    expect(result).toContain(`&lt;patientInfo&gt;${contentString1}&lt;/patientInfo&gt;`)
    expect(result).not.toContain(`<patientInfo>${contentString1}</patientInfo>`)
  })
})
