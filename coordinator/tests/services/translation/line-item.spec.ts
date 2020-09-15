import {
  convertMedicationRequestToLineItem,
  convertPrescriptionEndorsements
} from "../../../src/services/translation/line-item"
import {clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import {getMedicationRequests} from "../../../src/services/translation/common/getResourcesOfType"
import * as fhir from "../../../src/model/fhir-resources"
import {getExtensionForUrlOrNull} from "../../../src/services/translation/common"
import {convertBundleToPrescription} from "../../../src/services/translation/prescription"
import {convertFhirMessageToHl7V3ParentPrescriptionMessage} from "../../../src/services/translation/translation-service"
import {TooManyValuesError} from "../../../src/model/errors"

describe("convertMedicationRequestToLineItem", () => {
  let bundle: fhir.Bundle
  let firstFhirMedicationRequest: fhir.MedicationRequest

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    firstFhirMedicationRequest = getMedicationRequests(bundle)[0]
  })

  test("Throws TooManyValuesUserFacingError when passed multiple order item numbers", () => {
    firstFhirMedicationRequest.identifier.push(firstFhirMedicationRequest.identifier[0])
    expect(() => convertMedicationRequestToLineItem(firstFhirMedicationRequest)).toThrow(TooManyValuesError)
  })

  test("ID added to correct section of hl7 message", () => {
    const idValue = "exampleID"
    firstFhirMedicationRequest.identifier[0].value = idValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest)
    const resultIdValue = result.id._attributes.root

    expect(resultIdValue).toBe(idValue)
  })

  test("medicationCodeableConcept converted and added to correct section of hl7 message", () => {
    const codeValue = "exampleCode"
    const displayValue = "exampleDisplay"
    firstFhirMedicationRequest.medicationCodeableConcept.coding[0].code = codeValue
    firstFhirMedicationRequest.medicationCodeableConcept.coding[0].display = displayValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest)
    const resultCodeAttributes = result.product.manufacturedProduct.manufacturedRequestedMaterial.code._attributes

    expect(resultCodeAttributes.code).toBe(codeValue)
    expect(resultCodeAttributes.displayName).toBe(displayValue)
  })

  test("dispenseRequest.quantity.code added to correct section of hl7 message", () => {
    const codeValue = "exampleCode"
    firstFhirMedicationRequest.dispenseRequest.quantity.code = codeValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest)
    const resultTranslationCode = result.component.lineItemQuantity.quantity.translation._attributes.code

    expect(resultTranslationCode).toBe(codeValue)
  })

  test("dispenseRequest.quantity.unit added to correct section of hl7 message", () => {
    const unitValue = "exampleUnit"
    firstFhirMedicationRequest.dispenseRequest.quantity.unit = unitValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest)
    const resultLineItemQuantity = result.component.lineItemQuantity.quantity

    expect(resultLineItemQuantity.translation._attributes.displayName).toBe(unitValue)
  })

  test("dispenseRequest.quantity.value added to correct section of hl7 message", () => {
    const testValue = "exampleValue"
    firstFhirMedicationRequest.dispenseRequest.quantity.value = testValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest)
    const resultLineItemQuantity = result.component.lineItemQuantity.quantity

    expect(resultLineItemQuantity._attributes.value).toBe(testValue)
    expect(resultLineItemQuantity.translation._attributes.value).toBe(testValue)
  })

  test("dosageInstructions converted and added to correct section of hl7 message", () => {
    const dosageInstructionValue = "exampleText"
    firstFhirMedicationRequest.dosageInstruction[0].text = dosageInstructionValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest)
    const resultDosageinstructionValue = result.pertinentInformation2.pertinentDosageInstructions.value

    expect(resultDosageinstructionValue).toBe(dosageInstructionValue)
  })
})

describe("additionalInstructions", () => {
  let bundle: fhir.Bundle
  let firstFhirMedicationRequest: fhir.MedicationRequest

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    firstFhirMedicationRequest = getMedicationRequests(bundle)[0]
  })

  test("no controlledDrugWords, patientInstruction, or patientInfo doesn't create a pertinentInformation1", () => {
    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, "")
    expect(result.pertinentInformation1).toBe(undefined)
  })

  test("controlledDrugWords show up correctly", () => {
    const exampleControlledDrugString = "test1"
    const controlledDrugURL = "https://fhir.nhs.uk/R4/StructureDefinition/Extension-controlled-drug-quantity-words"
    const controlledDrugWordsExtension: fhir.StringExtension = {
      url: controlledDrugURL,
      valueString: exampleControlledDrugString
    }
    firstFhirMedicationRequest.dispenseRequest.extension.push(controlledDrugWordsExtension)
    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, "")
    expect(result.pertinentInformation1.pertinentAdditionalInstructions.value).toBe(`CD: ${exampleControlledDrugString}\n`)
  })

  test("patientInstruction show up correctly", () => {
    const patientInstruction = "test1"
    firstFhirMedicationRequest.dosageInstruction[0].patientInstruction = patientInstruction
    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, "")
    expect(result.pertinentInformation1.pertinentAdditionalInstructions.value).toBe(patientInstruction)
  })

  test("patientInfo show up correctly", () => {
    const patientInfo = "test1"
    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, patientInfo)
    expect(result.pertinentInformation1.pertinentAdditionalInstructions.value).toBe(patientInfo)
  })

  test("all info shows up in correct order", () => {
    const exampleControlledDrugString = "test1"
    const controlledDrugURL = "https://fhir.nhs.uk/R4/StructureDefinition/Extension-controlled-drug-quantity-words"
    const controlledDrugWordsExtension: fhir.StringExtension = {
      url: controlledDrugURL,
      valueString: exampleControlledDrugString
    }
    firstFhirMedicationRequest.dispenseRequest.extension.push(controlledDrugWordsExtension)
    const patientInstruction = "testPatientInstruction"
    firstFhirMedicationRequest.dosageInstruction[0].patientInstruction = patientInstruction
    const patientInfo = "testPatientInfo"
    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, patientInfo)
    expect(result.pertinentInformation1.pertinentAdditionalInstructions.value).toBe(`${patientInfo}CD: ${exampleControlledDrugString}\n${patientInstruction}`)
  })
})

describe("prescriptionEndorsements", () => {
  let bundle: fhir.Bundle
  let firstFhirMedicationRequest: fhir.MedicationRequest

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    firstFhirMedicationRequest = getMedicationRequests(bundle)[0]
  })

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
  })

  test("are translated when present", () => {
    const medicationRequests = getMedicationRequests(bundle)

    const prescriptionEndorsements = medicationRequests.map(medicationRequest =>
      getExtensionForUrlOrNull(
        medicationRequest.extension,
        "https://fhir.nhs.uk/R4/StructureDefinition/Extension-PrescriptionEndorsement",
        "MedicationRequest.extension"
      ) as fhir.CodeableConceptExtension
    )

    expect(prescriptionEndorsements.length).toBeGreaterThan(0)

    prescriptionEndorsements.map(prescriptionEndorsement =>
      expect(prescriptionEndorsement.valueCodeableConcept.coding.length).toBeGreaterThan(0)
    )

    const hl7v3LineItem = convertMedicationRequestToLineItem(firstFhirMedicationRequest)
    convertPrescriptionEndorsements(firstFhirMedicationRequest, hl7v3LineItem)
    const hl7v3PrescriptionEndorsements = hl7v3LineItem.pertinentInformation3

    expect(hl7v3PrescriptionEndorsements.length).toBeGreaterThan(0)

    hl7v3PrescriptionEndorsements
      .map(pi3 => expect(pi3.pertinentPrescriberEndorsement.value._attributes.code).toEqual("SLS"))
  })

  test("are optional for translation", () => {
    const medicationRequests = getMedicationRequests(bundle)

    const prescriptionEndorsementsFn = (medicationRequest: fhir.MedicationRequest): fhir.CodeableConceptExtension =>
      getExtensionForUrlOrNull(
        medicationRequest.extension,
        "https://fhir.nhs.uk/R4/StructureDefinition/Extension-PrescriptionEndorsement",
        "MedicationRequest.extension"
      ) as fhir.CodeableConceptExtension

    medicationRequests.forEach(medicationRequest => {
      const prescriptionEndorsements = prescriptionEndorsementsFn(medicationRequest)
      medicationRequest.extension.remove(prescriptionEndorsements)
      expect(prescriptionEndorsementsFn(medicationRequest)).toEqual(undefined)
    })

    const hl7v3Prescription = convertBundleToPrescription(bundle)
    const hl7v3PrescriptionEndorsements = hl7v3Prescription.pertinentInformation2.flatMap(pi2 => pi2.pertinentLineItem.pertinentInformation3)
    expect(hl7v3PrescriptionEndorsements.length).toBeGreaterThan(0)
    hl7v3PrescriptionEndorsements.map(endorsement => expect(endorsement).toEqual(undefined))

    const hl7v3PrescriptionXml = convertFhirMessageToHl7V3ParentPrescriptionMessage(bundle).message
    expect(hl7v3PrescriptionXml).not.toContain("pertinentInformation3")
  })
})
