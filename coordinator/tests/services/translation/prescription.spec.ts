import {addEmptyCommunicationRequestToBundle, clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import * as fhir from "../../../src/model/fhir-resources"
import {DateTimeExtension, MedicationRequest, RepeatInformationExtension} from "../../../src/model/fhir-resources"
import {
  convertBundleToPrescription,
  convertCourseOfTherapyType,
  convertNearestReviewDate,
  convertPrescriptionComponent1
} from "../../../src/services/translation/prescription"
import * as translator from "../../../src/services/translation/translation-service"
import {LineItemPertinentInformation1} from "../../../src/model/hl7-v3-prescriptions"
import {
  getCommunicationRequests,
  getMedicationRequests
} from "../../../src/services/translation/common/getResourcesOfType"
import {getExtensionForUrl} from "../../../src/services/translation/common"

describe("convertCourseOfTherapyType", () => {
  const cases = [
    ["acute", "0001"],
    ["continuous", "0002"],
    ["continuous-repeat-dispensing", "0003"]
  ]

  test.each(cases)("when first therapy type code is %p, convertCourseOfTherapyType returns prescription treatment type code %p",
    (code: string, expected: string) => {
      const bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
      const fhirMedicationRequests = getMedicationRequests(bundle)
      const firstFhirMedicationRequest = fhirMedicationRequests[0]
      firstFhirMedicationRequest.courseOfTherapyType.coding[0].code = code

      const treatmentTypeCode = convertCourseOfTherapyType(firstFhirMedicationRequest).value._attributes.code

      expect(treatmentTypeCode).toEqual(expected)
    })
})

describe("PertinentInformation2", () => {
  let bundle: fhir.Bundle
  let fhirCommunicationRequests: Array<fhir.CommunicationRequest>

  beforeEach(() => {
    bundle = getBundleWithEmptyCommunicationRequest()
    fhirCommunicationRequests = getCommunicationRequests(bundle)
  })

  function getBundleWithEmptyCommunicationRequest() {
    const result = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    result.entry = result.entry.filter((entry) => entry.resource.resourceType !== "CommunicationRequest")
    addEmptyCommunicationRequestToBundle(result)
    return result
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

  function ensureAtLeast2MedicationRequests(bundle: fhir.Bundle) {
    const fhirMedicationRequests = getMedicationRequests(bundle)
    if (fhirMedicationRequests.length == 1)
      bundle.entry.push({resource: fhirMedicationRequests[0]})
  }

  test("PatientInfo display on first LineItem only", () => {
    const contentString = "examplePatientInfo1"
    const expected = `<patientInfo>${contentString}</patientInfo>`
    fhirCommunicationRequests[0].payload.push({contentString: contentString})
    ensureAtLeast2MedicationRequests(bundle)

    const pertinentInformation2Array = convertBundleToPrescription(bundle).pertinentInformation2
      .map((pertinentInformation2) => pertinentInformation2.pertinentLineItem.pertinentInformation1)

    const firstPertinentInformation1 = pertinentInformation2Array.shift()
    expect(firstPertinentInformation1.pertinentAdditionalInstructions.value).toContain(expected)

    pertinentInformation2Array.forEach(checkValueDoesNotContainExpected)

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

describe("convertNearestReviewDate converts nearest review date", () => {
  let medicationRequests: Array<MedicationRequest>
  beforeEach(() => {
    const prescription = TestResources.examplePrescription1.fhirMessageUnsigned
    medicationRequests = getMedicationRequests(prescription)
  })

  test("for single medication request", () => {
    const medicationRequest = medicationRequests[0]
    setReviewDate(medicationRequest, "2020-09-03")
    const converted = convertNearestReviewDate([medicationRequest])
    expect(converted._attributes.value).toEqual("20200903")
  })

  test("for multiple medication requests with same review date", () => {
    medicationRequests.forEach(medicationRequest => setReviewDate(medicationRequest, "2020-09-03"))
    const converted = convertNearestReviewDate(medicationRequests)
    expect(converted._attributes.value).toEqual("20200903")
  })

  test("for multiple medication requests with different review dates", () => {
    setReviewDate(medicationRequests[0], "2020-12-03")
    setReviewDate(medicationRequests[1], "2020-09-03")
    setReviewDate(medicationRequests[2], "2020-12-03")
    setReviewDate(medicationRequests[3], "2020-12-03")
    const converted = convertNearestReviewDate(medicationRequests)
    expect(converted._attributes.value).toEqual("20200903")
  })
})

function setReviewDate(medicationRequest: MedicationRequest, newReviewDate: string) {
  const repeatInformationExtension = getExtensionForUrl(medicationRequest.extension, "https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation") as RepeatInformationExtension
  const reviewDateExtension = getExtensionForUrl(repeatInformationExtension.extension, "authorisationExpiryDate") as DateTimeExtension
  reviewDateExtension.valueDateTime = newReviewDate
}

describe("convertPrescriptionComponent1", () => {
  const validityPeriod = {
    start: "2020-09-03",
    end: "2021-03-03"
  }

  const expectedSupplyDuration = {
    value: "28",
    unit: "days",
    code: "d"
  }

  test("works when only validityPeriod is specified", () => {
    const converted = convertPrescriptionComponent1(validityPeriod, null)

    expect(converted.daysSupply.effectiveTime?.low?._attributes?.value).toEqual("20200903")
    expect(converted.daysSupply.effectiveTime?.high?._attributes?.value).toEqual("20210303")
    expect(converted.daysSupply.expectedUseTime).toBeFalsy()
  })

  test("works when only expectedSupplyDuration is specified", () => {
    const converted = convertPrescriptionComponent1(null, expectedSupplyDuration)

    expect(converted.daysSupply.effectiveTime).toBeFalsy()
    expect(converted.daysSupply.expectedUseTime?.width?._attributes?.value).toEqual("28")
  })

  test("works when validityPeriod and expectedSupplyDuration are specified", () => {
    const converted = convertPrescriptionComponent1(validityPeriod, expectedSupplyDuration)

    expect(converted.daysSupply.effectiveTime?.low?._attributes?.value).toEqual("20200903")
    expect(converted.daysSupply.effectiveTime?.high?._attributes?.value).toEqual("20210303")
    expect(converted.daysSupply.expectedUseTime?.width?._attributes?.value).toEqual("28")
  })

  test("throws error when expectedSupplyDuration is specified in units other than days", () => {
    expect(() => {
      convertPrescriptionComponent1(null, {
        value: "2419200",
        unit: "seconds",
        code: "s"
      })
    }).toThrow()
  })
})
