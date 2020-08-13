import {convertMedicationRequestToLineItem} from "../../../src/services/translation/line-item"
import {Bundle, MedicationRequest} from "../../../src/model/fhir-resources"
import {clone} from "../../resources/test-helpers"
import * as TestResources from "../../resources/test-resources"
import {getResourcesOfType} from "../../../src/services/translation/common"

describe("convertMedicationRequestToLineItem", () => {
  let bundle: Bundle
  let firstFhirMedicationRequest: MedicationRequest

  beforeEach(() => {
    bundle = clone(TestResources.examplePrescription1.fhirMessageUnsigned)
    firstFhirMedicationRequest = getResourcesOfType(bundle, new MedicationRequest())[0]
  })

  test("Throws TypeError when passed multiple order item numbers", () => {
    firstFhirMedicationRequest.identifier.push(firstFhirMedicationRequest.identifier[0])
    expect(() => convertMedicationRequestToLineItem(firstFhirMedicationRequest)).toThrow(TypeError)
  })

  test("ID added to correct section of hl7 message", () => {
    const idValue = "exampleID"
    firstFhirMedicationRequest.identifier[0].value = idValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest)
    const resultMappedValues = result.id._attributes.root

    expect(resultMappedValues).toBe(idValue)
  })

  test("medicationCodeableConcept converted and added to correct section of hl7 message", () => {
    const codeValue = "exampleCode"
    const displayValue = "exampleDisplay"
    firstFhirMedicationRequest.medicationCodeableConcept.coding[0].code = codeValue
    firstFhirMedicationRequest.medicationCodeableConcept.coding[0].display = displayValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest).product
    const resultMappedValues = result.manufacturedProduct.manufacturedRequestedMaterial.code._attributes

    expect(resultMappedValues.code).toBe(codeValue)
    expect(resultMappedValues.displayName).toBe(displayValue)
  })

  test("dispenseRequest.quantity.code added to correct section of hl7 message", () => {
    const codeValue = "exampleCode"
    firstFhirMedicationRequest.dispenseRequest.quantity.code = codeValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest).component
    const resultMappedValues = result.lineItemQuantity.quantity.translation._attributes.code

    expect(resultMappedValues).toBe(codeValue)
  })

  test("dispenseRequest.quantity.unit added to correct section of hl7 message", () => {
    const unitValue = "exampleUnit"
    firstFhirMedicationRequest.dispenseRequest.quantity.unit = unitValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest).component
    const resultMappedValues = result.lineItemQuantity.quantity

    expect(resultMappedValues.translation._attributes.displayName).toBe(unitValue)
  })

  test("dispenseRequest.quantity.value added to correct section of hl7 message", () => {
    const testValue = "exampleValue"
    firstFhirMedicationRequest.dispenseRequest.quantity.value = testValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest).component
    const resultMappedValues = result.lineItemQuantity.quantity

    expect(resultMappedValues._attributes.value).toBe(testValue)
    expect(resultMappedValues.translation._attributes.value).toBe(testValue)
  })

  test("dosageInstructions converted and added to correct section of hl7 message", () => {
    const dosageInstructionValue = "exampleText"
    firstFhirMedicationRequest.dosageInstruction[0].text = dosageInstructionValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest).pertinentInformation2
    const resultMappedValues = result.pertinentDosageInstructions.value

    expect(resultMappedValues).toBe(dosageInstructionValue)
  })
})
