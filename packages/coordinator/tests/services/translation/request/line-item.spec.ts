import {convertMedicationRequestToLineItem} from "../../../../src/services/translation/request/line-item"
import {clone} from "../../../resources/test-helpers"
import * as TestResources from "../../../resources/test-resources"
import {getMedicationRequests} from "../../../../src/services/translation/common/getResourcesOfType"
import {getExtensionForUrlOrNull, toArray} from "../../../../src/services/translation/common"
import {convertBundleToPrescription} from "../../../../src/services/translation/request/prescription"
import {convertBundleToSpineRequest} from "../../../../src/services/translation/request"
import {fhir, hl7V3, processingErrors as errors} from "@models"
import pino from "pino"

const logger = pino()

describe("convertMedicationRequestToLineItem", () => {
  let bundle: fhir.Bundle
  let firstFhirMedicationRequest: fhir.MedicationRequest
  let coding: fhir.Coding

  beforeEach(() => {
    bundle = clone(TestResources.specification[0].fhirMessageUnsigned)
    firstFhirMedicationRequest = getMedicationRequests(bundle)[0]
    coding = firstFhirMedicationRequest.medicationCodeableConcept.coding[0]
  })

  test("Throws TooManyValuesError when passed multiple order item numbers", () => {
    firstFhirMedicationRequest.identifier.push(firstFhirMedicationRequest.identifier[0])
    expect(() => convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, [], [], coding, logger)).toThrow(
      errors.TooManyValuesError
    )
  })

  test("Throws TooFewValuesError when passed no dispenseRequest performer-site-type extension", () => {
    firstFhirMedicationRequest.dispenseRequest.extension = []
    expect(() => convertBundleToPrescription(bundle, logger)).toThrow(errors.TooFewValuesError)
  })

  test("Throws InvalidValueError when passed no dispenseRequest extensions", () => {
    firstFhirMedicationRequest.dispenseRequest.extension = undefined
    expect(() => convertBundleToPrescription(bundle, logger)).toThrow(errors.InvalidValueError)
  })

  test("ID added to correct section of hl7 message", () => {
    const idValue = "exampleID"
    firstFhirMedicationRequest.identifier[0].value = idValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, [], [], coding, logger)
    const resultIdValue = result.id._attributes.root

    expect(resultIdValue).toBe(idValue)
  })

  test("repeat number added to correct section of hl7 message", () => {
    const repeatNumber = new hl7V3.Interval(new hl7V3.NumericValue("1"), new hl7V3.NumericValue("6"))
    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, repeatNumber, [], [], coding, logger)
    const resultIdValue = result.repeatNumber
    expect(resultIdValue).toBe(repeatNumber)
  })

  test("medicationCodeableConcept converted and added to correct section of hl7 message", () => {
    const codeValue = "exampleCode"
    const displayValue = "exampleDisplay"
    firstFhirMedicationRequest.medicationCodeableConcept.coding[0].code = codeValue
    firstFhirMedicationRequest.medicationCodeableConcept.coding[0].display = displayValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, [], [], coding, logger)
    const resultCodeAttributes = result.product.manufacturedProduct.manufacturedRequestedMaterial.code._attributes

    expect(resultCodeAttributes.code).toBe(codeValue)
    expect(resultCodeAttributes.displayName).toBe(displayValue)
  })

  test("dispenseRequest.quantity.code added to correct section of hl7 message", () => {
    const codeValue = "exampleCode"
    firstFhirMedicationRequest.dispenseRequest.quantity.code = codeValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, [], [], coding, logger)
    const resultTranslationCode = result.component.lineItemQuantity.quantity.translation._attributes.code

    expect(resultTranslationCode).toBe(codeValue)
  })

  test("dispenseRequest.quantity.unit added to correct section of hl7 message", () => {
    const unitValue = "exampleUnit"
    firstFhirMedicationRequest.dispenseRequest.quantity.unit = unitValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, [], [], coding, logger)
    const resultLineItemQuantity = result.component.lineItemQuantity.quantity

    expect(resultLineItemQuantity.translation._attributes.displayName).toBe(unitValue)
  })

  test("dispenseRequest.quantity.value added to correct section of hl7 message", () => {
    const testValue = "exampleValue"
    firstFhirMedicationRequest.dispenseRequest.quantity.value = testValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, [], [], coding, logger)
    const resultLineItemQuantity = result.component.lineItemQuantity.quantity

    expect(resultLineItemQuantity._attributes.value).toBe(testValue)
    expect(resultLineItemQuantity.translation._attributes.value).toBe(testValue)
  })

  test("dosageInstructions converted and added to correct section of hl7 message", () => {
    const dosageInstructionValue = "exampleText"
    firstFhirMedicationRequest.dosageInstruction[0].text = dosageInstructionValue

    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, [], [], coding, logger)
    const resultDosageinstructionValue = result.pertinentInformation2.pertinentDosageInstructions.value._text

    expect(resultDosageinstructionValue).toBe(dosageInstructionValue)
  })
})

describe("additionalInstructions", () => {
  let bundle: fhir.Bundle
  let firstFhirMedicationRequest: fhir.MedicationRequest
  let coding: fhir.Coding

  beforeEach(() => {
    bundle = clone(TestResources.specification[0].fhirMessageUnsigned)
    firstFhirMedicationRequest = getMedicationRequests(bundle)[0]
    coding = firstFhirMedicationRequest.medicationCodeableConcept.coding[0]
  })

  test("no controlledDrugWords, notes, or patientInfo doesn't create a pertinentInformation1", () => {
    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, [], [], coding, logger)
    expect(result.pertinentInformation1).toBe(undefined)
  })

  test("controlledDrugWords show up correctly", () => {
    const controlledDrugWordsExtension: fhir.StringExtension = {
      url: "quantityWords",
      valueString: "test1"
    }
    const controlledDrugExtension: fhir.ControlledDrugExtension = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ControlledDrug",
      extension: [controlledDrugWordsExtension]
    }
    firstFhirMedicationRequest.extension.push(controlledDrugExtension)
    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, [], [], coding, logger)
    expect(result.pertinentInformation1.pertinentAdditionalInstructions.value._text).toBe("CD: test1")
  })

  test("notes show up correctly", () => {
    firstFhirMedicationRequest.note = [
      {
        text: "test1"
      }
    ]
    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, [], [], coding, logger)
    expect(result.pertinentInformation1.pertinentAdditionalInstructions.value._text).toBe("test1")
  })

  test("single medication shows up correctly", () => {
    const medication = [new hl7V3.Text("test1")]
    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, medication, [], coding, logger)
    expect(result.pertinentInformation1.pertinentAdditionalInstructions.value._text).toBe(
      "<medication>test1</medication>"
    )
  })

  test("multiple medication show up correctly", () => {
    const medication = [new hl7V3.Text("test1"), new hl7V3.Text("test2")]
    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, medication, [], coding, logger)
    expect(result.pertinentInformation1.pertinentAdditionalInstructions.value._text).toBe(
      "<medication>test1</medication><medication>test2</medication>"
    )
  })

  test("single patientInfo shows up correctly", () => {
    const patientInfo = [new hl7V3.Text("test1")]
    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, [], patientInfo, coding, logger)
    expect(result.pertinentInformation1.pertinentAdditionalInstructions.value._text).toBe(
      "<patientInfo>test1</patientInfo>"
    )
  })

  test("multiple patientInfo show up correctly", () => {
    const patientInfo = [new hl7V3.Text("test1"), new hl7V3.Text("test2")]
    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, [], patientInfo, coding, logger)
    expect(result.pertinentInformation1.pertinentAdditionalInstructions.value._text).toBe(
      "<patientInfo>test1</patientInfo><patientInfo>test2</patientInfo>"
    )
  })

  test("XML characters are escaped in patientInfo", () => {
    const patientInfo = [new hl7V3.Text("Phone practice if BP < 90/60 mmHg")]
    const result = convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, [], patientInfo, coding, logger)
    expect(result.pertinentInformation1.pertinentAdditionalInstructions.value._text).toBe(
      "<patientInfo>Phone practice if BP &lt; 90/60 mmHg</patientInfo>"
    )
  })

  test("all info shows up in correct order with line break as separator", () => {
    const controlledDrugWordsExtension: fhir.StringExtension = {
      url: "quantityWords",
      valueString: "test1"
    }
    const controlledDrugExtension: fhir.ControlledDrugExtension = {
      url: "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ControlledDrug",
      extension: [controlledDrugWordsExtension]
    }
    firstFhirMedicationRequest.extension.push(controlledDrugExtension)
    firstFhirMedicationRequest.note = [
      {
        text: "testDispenserInstruction"
      }
    ]
    const medication = [new hl7V3.Text("testMedication")]
    const patientInfo = [new hl7V3.Text("testPatientInfo")]
    const result = convertMedicationRequestToLineItem(
      firstFhirMedicationRequest,
      null,
      medication,
      patientInfo,
      coding,
      logger
    )
    expect(result.pertinentInformation1.pertinentAdditionalInstructions.value._text).toBe(
      // eslint-disable-next-line max-len
      "<medication>testMedication</medication><patientInfo>testPatientInfo</patientInfo>CD: test1\ntestDispenserInstruction"
    )
  })
})

describe("prescriptionEndorsements", () => {
  let bundle: fhir.Bundle
  let firstFhirMedicationRequest: fhir.MedicationRequest
  let coding: fhir.Coding

  beforeEach(() => {
    bundle = clone(TestResources.specification[0].fhirMessageUnsigned)
    firstFhirMedicationRequest = getMedicationRequests(bundle)[0]
    coding = firstFhirMedicationRequest.medicationCodeableConcept.coding[0]
  })

  beforeEach(() => {
    bundle = clone(TestResources.specification[0].fhirMessageUnsigned)
  })

  test("are translated when present", () => {
    const medicationRequests = getMedicationRequests(bundle)

    const prescriptionEndorsements = medicationRequests.map(
      (medicationRequest) =>
        getExtensionForUrlOrNull(
          medicationRequest.extension,
          "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement",
          "MedicationRequest.extension"
        ) as fhir.CodeableConceptExtension
    )

    expect(prescriptionEndorsements.length).toBeGreaterThan(0)

    prescriptionEndorsements.forEach((prescriptionEndorsement) =>
      expect(prescriptionEndorsement.valueCodeableConcept.coding.length).toBeGreaterThan(0)
    )

    const hl7v3LineItem = convertMedicationRequestToLineItem(firstFhirMedicationRequest, null, [], [], coding, logger)
    const hl7v3PrescriptionEndorsements = hl7v3LineItem.pertinentInformation3

    expect(hl7v3PrescriptionEndorsements.length).toBeGreaterThan(0)

    hl7v3PrescriptionEndorsements.forEach((pi3) =>
      expect(pi3.pertinentPrescriberEndorsement.value._attributes.code).toEqual("SLS")
    )
  })

  test("are optional for translation", async () => {
    const medicationRequests = getMedicationRequests(bundle)

    const prescriptionEndorsementsFn = (medicationRequest: fhir.MedicationRequest): fhir.CodeableConceptExtension =>
      getExtensionForUrlOrNull(
        medicationRequest.extension,
        "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement",
        "MedicationRequest.extension"
      ) as fhir.CodeableConceptExtension

    medicationRequests.forEach((medicationRequest) => {
      const prescriptionEndorsements = prescriptionEndorsementsFn(medicationRequest)
      medicationRequest.extension.remove(prescriptionEndorsements)
      expect(prescriptionEndorsementsFn(medicationRequest)).toEqual(undefined)
    })

    const hl7v3Prescription = convertBundleToPrescription(bundle, logger)
    const hl7v3PrescriptionEndorsements = toArray(hl7v3Prescription.pertinentInformation2).flatMap(
      (pi2) => pi2.pertinentLineItem.pertinentInformation3
    )
    expect(hl7v3PrescriptionEndorsements.length).toBeGreaterThan(0)
    hl7v3PrescriptionEndorsements.forEach((endorsement) => expect(endorsement).toEqual(undefined))

    const headers = {
      "nhsd-request-id": "test",
      "nhsd-asid": "200000001285",
      "nhsd-party-key": "T141D-822234",
      "nhsd-identity-uuid": "555254239107", //USERQ RANDOM Mr
      "nhsd-session-urid": "555254240100", //S8000:G8000:R8001 - "Clinical":"Clinical Provision":"Nurse Access Role"
      "nhsd-correlation-id": "test-correlation-id"
    }

    const hl7v3PrescriptionXml = (await convertBundleToSpineRequest(bundle, headers, logger)).message
    expect(hl7v3PrescriptionXml).not.toContain("pertinentInformation3")
  })
})
