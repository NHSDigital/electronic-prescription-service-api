import {addEmptyCommunicationRequestToBundle, clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import * as fhir from "../../../src/model/fhir-resources"
import {convertBundleToPrescription, convertCourseOfTherapyType} from "../../../src/services/translation/prescription"
import * as translator from "../../../src/services/translation/translation-service"
import {LineItemPertinentInformation1} from "../../../src/model/hl7-v3-prescriptions"
import {
  getCommunicationRequests,
  getMedicationRequests
} from "../../../src/services/translation/common/getResourcesOfType"

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

  test("Prescriber Endorsements are translated when present", () => {
    const medicationRequests = getMedicationRequests(bundle)

    const prescriptionEndorsements = medicationRequests
      .map(medicationRequest => 
        getExtensionForUrlOrNull(medicationRequest.extension, "https://fhir.nhs.uk/R4/StructureDefinition/Extension-PrescriptionEndorsement") as CodeableConceptExtension)

    expect(prescriptionEndorsements.length).toBeGreaterThan(0)
   
    prescriptionEndorsements.map(prescriptionEndorsement => 
      expect(prescriptionEndorsement.valueCodeableConcept.coding.length).toBeGreaterThan(0)
    )
    
    const hl7v3Prescription = convertBundleToPrescription(bundle)

    const hl7v3PrescriptionEndorsements = hl7v3Prescription.pertinentInformation2
      .flatMap(pi2 => pi2.pertinentLineItem.pertinentInformation3)

    expect(hl7v3PrescriptionEndorsements.length).toBeGreaterThan(0)

    hl7v3Prescription.pertinentInformation2
      .flatMap(pi2 => pi2.pertinentLineItem.pertinentInformation3)
      .map(pi3 => expect(pi3.pertinentPrescriberEndorsement.value._attributes.code).toEqual("SLS"))
  })

  test("Prescriber Endorsements are optional for translation", () => {
    const medicationRequests = getMedicationRequests(bundle)

    const prescriptionEndorsementsFn = (medicationRequest: fhir.MedicationRequest) => medicationRequest.extension
      .filter(extension => extension.url === "https://fhir.nhs.uk/R4/StructureDefinition/Extension-PrescriptionEndorsement")

    medicationRequests.forEach(medicationRequest => {
      const prescriptionEndorsements = prescriptionEndorsementsFn(medicationRequest)
      medicationRequest.extension.removeAll(prescriptionEndorsements)
      expect(prescriptionEndorsementsFn(medicationRequest)).toEqual([])
    })

    const hl7v3Prescription = convertBundleToPrescription(bundle)

    const hl7v3PrescriptionEndorsements = hl7v3Prescription.pertinentInformation2.flatMap(pi2 => pi2.pertinentLineItem.pertinentInformation3)

    expect(hl7v3PrescriptionEndorsements.length).toBeGreaterThan(0)

    hl7v3PrescriptionEndorsements.map(endorsement => expect(endorsement).toEqual(undefined))
  })
})
