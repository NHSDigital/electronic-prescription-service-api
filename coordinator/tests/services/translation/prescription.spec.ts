import {addEmptyCommunicationRequestToBundle, clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import * as fhir from "../../../src/models/fhir/fhir-resources"
import {
  DateTimeExtension,
  MedicationRequest,
  RepeatInformationExtension,
  UnsignedIntExtension
} from "../../../src/models/fhir/fhir-resources"
import {
  convertBundleToPrescription,
  convertCourseOfTherapyType,
  convertPrescriptionComponent1,
  convertRepeatNumber,
  extractReviewDate
} from "../../../src/services/translation/prescription"
import * as translator from "../../../src/services/translation"
import {LineItemPertinentInformation1} from "../../../src/models/hl7-v3/hl7-v3-prescriptions"
import {
  getCommunicationRequests,
  getMedicationRequests
} from "../../../src/services/translation/common/getResourcesOfType"
import {getExtensionForUrl} from "../../../src/services/translation/common"
import {setCourseOfTherapyTypeCode} from "./course-of-therapy-type.spec"
import {CourseOfTherapyTypeCode} from "../../../src/services/translation/prescription/course-of-therapy-type"

describe("convertCourseOfTherapyType", () => {
  const cases = [
    ["acute", "0001"],
    ["continuous", "0002"],
    ["continuous-repeat-dispensing", "0003"]
  ]

  test.each(cases)(
    "when first therapy type code is %p, convertCourseOfTherapyType returns prescription treatment type code %p",
    (code: CourseOfTherapyTypeCode, expected: string) => {
      const bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
      const fhirMedicationRequests = getMedicationRequests(bundle)
      fhirMedicationRequests.map(medicationRequest => setCourseOfTherapyTypeCode(medicationRequest, code))

      const treatmentTypeCode = convertCourseOfTherapyType(fhirMedicationRequests).value._attributes.code

      expect(treatmentTypeCode).toEqual(expected)
    }
  )
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
    const additionalInstructions = firstPertinentInformation2.pertinentLineItem.pertinentInformation1
      .pertinentAdditionalInstructions.value
    const expected = `<patientInfo>${contentString}</patientInfo>`
    expect(additionalInstructions).toContain(expected)
  })

  test("multiple PatientInfos display correctly", () => {
    const contentString1 = "examplePatientInfo1"
    const contentString2 = "secondExamplePatientInfo"
    fhirCommunicationRequests[0].payload.push({contentString: contentString1}, {contentString: contentString2})

    const pertinentInformation2Array = convertBundleToPrescription(bundle).pertinentInformation2

    const firstPertinentInformation2 = pertinentInformation2Array[0]
    const additionalInstructions = firstPertinentInformation2.pertinentLineItem.pertinentInformation1
      .pertinentAdditionalInstructions.value
    expect(
      additionalInstructions
    ).toContain(
      `<patientInfo>${contentString1}</patientInfo><patientInfo>${contentString2}</patientInfo>`
    )
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

    const result = translator.convertFhirMessageToSpineRequest(bundle).message
    expect(result).toContain(`&lt;patientInfo&gt;${contentString1}&lt;/patientInfo&gt;`)
    expect(result).not.toContain(`<patientInfo>${contentString1}</patientInfo>`)
  })
})

describe("extractReviewDate returns the correct value", () => {
  let medicationRequest: MedicationRequest
  beforeEach(() => {
    const prescription = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    medicationRequest = getMedicationRequests(prescription)[0]
  })

  test("for a medication request with a review date", () => {
    setReviewDate(medicationRequest, "2020-09-03")
    const converted = extractReviewDate(medicationRequest)
    expect(converted).toEqual("2020-09-03")
  })

  test("for a medication request with repeat information but without a review date", () => {
    clearRepeatInformationField(medicationRequest, "authorisationExpiryDate")
    const converted = extractReviewDate(medicationRequest)
    expect(converted).toBeFalsy()
  })

  test("for a medication request without repeat information", () => {
    clearRepeatInformation(medicationRequest)
    const converted = extractReviewDate(medicationRequest)
    expect(converted).toBeFalsy()
  })
})

function setReviewDate(medicationRequest: MedicationRequest, newReviewDate: string) {
  const repeatInformationExtension = getExtensionForUrl(
    medicationRequest.extension,
    "https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
    "MedicationRequest.extension"
  ) as RepeatInformationExtension
  const reviewDateExtension = getExtensionForUrl(
    repeatInformationExtension.extension,
    "authorisationExpiryDate",
    "MedicationRequest.extension.extension"
  ) as DateTimeExtension
  reviewDateExtension.valueDateTime = newReviewDate
}

function clearRepeatInformation(medicationRequest: MedicationRequest) {
  const repeatInformationExtension = getExtensionForUrl(
    medicationRequest.extension,
    "https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
    "MedicationRequest.extension"
  ) as RepeatInformationExtension
  medicationRequest.extension.splice(medicationRequest.extension.indexOf(repeatInformationExtension), 1)
}

function clearRepeatInformationField(medicationRequest: MedicationRequest, url: string) {
  const repeatInformationExtension = getExtensionForUrl(
    medicationRequest.extension,
    "https://fhir.nhs.uk/R4/StructureDefinition/Extension-UKCore-MedicationRepeatInformation",
    "MedicationRequest.extension"
  ) as RepeatInformationExtension
  const reviewDateExtension = getExtensionForUrl(
    repeatInformationExtension.extension,
    url,
    "MedicationRequest.extension.extension"
  ) as DateTimeExtension | UnsignedIntExtension
  repeatInformationExtension.extension.splice(repeatInformationExtension.extension.indexOf(reviewDateExtension), 1)
}

describe("createRepeatNumberForMedicationRequests", () => {
  let medicationRequests: Array<MedicationRequest>
  beforeEach(() => {
    const prescription = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    medicationRequests = getMedicationRequests(prescription)
  })

  test("does nothing for acute prescriptions", () => {
    medicationRequests.forEach(medicationRequest =>
      setCourseOfTherapyTypeCode(medicationRequest, CourseOfTherapyTypeCode.ACUTE)
    )

    const repeatNumber = convertRepeatNumber(medicationRequests)

    expect(repeatNumber).toBeNull()
  })

  test("does nothing for mixed acute / repeat prescribing prescriptions", () => {
    setCourseOfTherapyTypeCode(medicationRequests[0], CourseOfTherapyTypeCode.CONTINUOUS)
    setCourseOfTherapyTypeCode(medicationRequests[1], CourseOfTherapyTypeCode.CONTINUOUS)
    setCourseOfTherapyTypeCode(medicationRequests[2], CourseOfTherapyTypeCode.ACUTE)
    setCourseOfTherapyTypeCode(medicationRequests[3], CourseOfTherapyTypeCode.ACUTE)

    const repeatNumber = convertRepeatNumber(medicationRequests)

    expect(repeatNumber).toBeNull()
  })

  test("sets 1-1 for repeat prescribing prescriptions", () => {
    medicationRequests.forEach(medicationRequest =>
      setCourseOfTherapyTypeCode(medicationRequest, CourseOfTherapyTypeCode.CONTINUOUS)
    )

    const repeatNumber = convertRepeatNumber(medicationRequests)

    expect(repeatNumber?.low?._attributes?.value).toEqual("1")
    expect(repeatNumber?.high?._attributes?.value).toEqual("1")
  })

  test("sets 1-X for repeat dispensing prescriptions with consistent repeat numbers X", () => {
    medicationRequests.forEach(medicationRequest =>
      setCourseOfTherapyTypeCode(medicationRequest, CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)
    )

    const repeatNumber = convertRepeatNumber(medicationRequests)

    expect(repeatNumber?.low?._attributes?.value).toEqual("1")
    expect(repeatNumber?.high?._attributes?.value).toEqual("6")
  })

  test("throws for repeat dispensing prescriptions where repeat number is missing", () => {
    medicationRequests.forEach(medicationRequest => {
      setCourseOfTherapyTypeCode(medicationRequest, CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)
      clearRepeatInformationField(medicationRequest, "numberOfRepeatPrescriptionsAllowed")
    })

    expect(() => {
      convertRepeatNumber(medicationRequests)
    }).toThrow()
  })

  test("throws for repeat dispensing prescriptions where repeat information is missing", () => {
    medicationRequests.forEach(medicationRequest => {
      setCourseOfTherapyTypeCode(medicationRequest, CourseOfTherapyTypeCode.CONTINUOUS_REPEAT_DISPENSING)
      clearRepeatInformation(medicationRequest)
    })

    expect(() => {
      convertRepeatNumber(medicationRequests)
    }).toThrow()
  })
})

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
