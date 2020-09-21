import * as fhir from "../../model/fhir-resources"
import {
  getCodingForSystem,
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getNumericValueAsString, onlyElement
} from "./common"
import * as core from "../../model/hl7-v3-datatypes-core"
import * as codes from "../../model/hl7-v3-datatypes-codes"
import * as prescriptions from "../../model/hl7-v3-prescriptions"
import {populateRepeatNumber} from "./common/repeatNumber"

function convertProduct(medicationCodeableConcept: fhir.CodeableConcept) {
  const fhirMedicationCode = getCodingForSystem(
    medicationCodeableConcept.coding,
    "http://snomed.info/sct",
    "MedicationRequest.medicationCodeableConcept.coding"
  )
  const hl7V3MedicationCode = new codes.SnomedCode(fhirMedicationCode.code, fhirMedicationCode.display)
  const manufacturedRequestedMaterial = new prescriptions.ManufacturedRequestedMaterial(hl7V3MedicationCode)
  const manufacturedProduct = new prescriptions.ManufacturedProduct(manufacturedRequestedMaterial)
  return new prescriptions.Product(manufacturedProduct)
}

function convertLineItemComponent(fhirQuantity: fhir.SimpleQuantity) {
  const hl7V3LineItemQuantity = new prescriptions.LineItemQuantity()
  const hl7V3UnitCode = new codes.SnomedCode(fhirQuantity.code, fhirQuantity.unit)
  const value = getNumericValueAsString(fhirQuantity.value)
  hl7V3LineItemQuantity.quantity = new core.QuantityInAlternativeUnits(value, value, hl7V3UnitCode)
  return new prescriptions.LineItemComponent(hl7V3LineItemQuantity)
}

function convertDosageInstructions(dosageInstruction: Array<fhir.Dosage>) {
  const dosageInstructionsValue = onlyElement(
    dosageInstruction,
    "MedicationRequest.dosageInstruction"
  ).text
  const hl7V3DosageInstructions = new prescriptions.DosageInstructions(dosageInstructionsValue)
  return new prescriptions.LineItemPertinentInformation2(hl7V3DosageInstructions)
}

export function convertPrescriptionEndorsements(fhirMedicationRequest: fhir.MedicationRequest, hl7V3LineItem: prescriptions.LineItem): void {
  const fhirMedicationPrescriptionEndorsementExtension = getExtensionForUrlOrNull(
    fhirMedicationRequest.extension,
    "https://fhir.nhs.uk/R4/StructureDefinition/Extension-PrescriptionEndorsement",
    "MedicationRequest.extension"
  ) as fhir.CodeableConceptExtension

  if (fhirMedicationPrescriptionEndorsementExtension) {
    hl7V3LineItem.pertinentInformation3 = fhirMedicationPrescriptionEndorsementExtension.valueCodeableConcept.coding.map(coding => {
      const prescriptionEndorsementValue = new codes.PrescriptionEndorsementCode(coding.code)
      const prescriptionEndorsement = new prescriptions.PrescriptionEndorsement(prescriptionEndorsementValue)
      return new prescriptions.LineItemPertinentInformation3(prescriptionEndorsement)
    })
  } else {
    delete hl7V3LineItem.pertinentInformation3
  }
}

function convertAdditionalInstructions(fhirMedicationRequest: fhir.MedicationRequest, patientInfoStr: string)  {
  const controlledDrugWordsExtension = getExtensionForUrlOrNull(
    fhirMedicationRequest.dispenseRequest.extension,
    "https://fhir.nhs.uk/R4/StructureDefinition/Extension-controlled-drug-quantity-words",
    "MedicationRequest.dispenseRequest.extension"
  ) as fhir.StringExtension
  const controlledDrugWords = controlledDrugWordsExtension?.valueString
  const controlledDrugStr = controlledDrugWords ? `CD: ${controlledDrugWords}\n` : ""

  const patientInstruction = onlyElement(
    fhirMedicationRequest.dosageInstruction,
    "MedicationRequest.dosageInstruction"
  ).patientInstruction
  const patientInstructionStr = patientInstruction ? patientInstruction : ""

  const additionalInstructionsValue = `${patientInfoStr}${controlledDrugStr}${patientInstructionStr}`
  const hl7V3AdditionalInstructions = new prescriptions.AdditionalInstructions(additionalInstructionsValue)
  return new prescriptions.LineItemPertinentInformation1(hl7V3AdditionalInstructions)
}

export function convertMedicationRequestToLineItem(fhirMedicationRequest: fhir.MedicationRequest, patientInfoStr = ""): prescriptions.LineItem {
  const lineItemId = getIdentifierValueForSystem(
    fhirMedicationRequest.identifier,
    "https://fhir.nhs.uk/Id/prescription-order-item-number",
    "MedicationRequest.identifier"
  )
  const hl7V3LineItem = new prescriptions.LineItem(
    new codes.GlobalIdentifier(lineItemId)
  )

  populateRepeatNumber(hl7V3LineItem, [fhirMedicationRequest])

  hl7V3LineItem.product = convertProduct(fhirMedicationRequest.medicationCodeableConcept)
  hl7V3LineItem.component = convertLineItemComponent(fhirMedicationRequest.dispenseRequest.quantity)
  convertPrescriptionEndorsements(fhirMedicationRequest, hl7V3LineItem)
  hl7V3LineItem.pertinentInformation2 = convertDosageInstructions(fhirMedicationRequest.dosageInstruction)

  const pertinentInformation1 = convertAdditionalInstructions(fhirMedicationRequest, patientInfoStr)
  if (pertinentInformation1.pertinentAdditionalInstructions.value != "")
    hl7V3LineItem.pertinentInformation1 = pertinentInformation1

  return hl7V3LineItem
}
