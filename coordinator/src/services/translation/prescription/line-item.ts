import * as fhir from "../../../models/fhir/fhir-resources"
import {
  getCodingForSystem,
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getNumericValueAsString, isTruthy,
  onlyElement
} from "../common"
import * as core from "../../../models/hl7-v3/hl7-v3-datatypes-core"
import * as codes from "../../../models/hl7-v3/hl7-v3-datatypes-codes"
import * as prescriptions from "../../../models/hl7-v3/hl7-v3-prescriptions"
import {ElementCompact, js2xml} from "xml-js"

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

export function convertPrescriptionEndorsements(
  fhirMedicationRequest: fhir.MedicationRequest,
  hl7V3LineItem: prescriptions.LineItem
): void {
  const fhirMedicationPrescriptionEndorsementExtension = getExtensionForUrlOrNull(
    fhirMedicationRequest.extension,
    "https://fhir.nhs.uk/R4/StructureDefinition/Extension-PrescriptionEndorsement",
    "MedicationRequest.extension"
  ) as fhir.CodeableConceptExtension

  if (fhirMedicationPrescriptionEndorsementExtension) {
    hl7V3LineItem.pertinentInformation3 = fhirMedicationPrescriptionEndorsementExtension.valueCodeableConcept.coding
      .map(coding => {
        const prescriptionEndorsementValue = new codes.PrescriptionEndorsementCode(coding.code)
        const prescriptionEndorsement = new prescriptions.PrescriptionEndorsement(prescriptionEndorsementValue)
        return new prescriptions.LineItemPertinentInformation3(prescriptionEndorsement)
      })
  } else {
    delete hl7V3LineItem.pertinentInformation3
  }
}

function convertAdditionalInstructions(
  fhirMedicationRequest: fhir.MedicationRequest,
  patientInfoText: Array<core.Text>
) {
  const controlledDrugExtension = getExtensionForUrlOrNull(
    fhirMedicationRequest.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ControlledDrug",
    "MedicationRequest.extension"
  ) as fhir.ControlledDrugExtension
  const controlledDrugWordsExtension = controlledDrugExtension ? getExtensionForUrlOrNull(
    controlledDrugExtension.extension,
    "quantityWords",
    "MedicationRequest.extension.extension"
  ) as fhir.StringExtension : null
  const controlledDrugWords = controlledDrugWordsExtension?.valueString
  const controlledDrugWordsWithPrefix = controlledDrugWords ? `CD: ${controlledDrugWords}` : ""

  const patientInstruction = onlyElement(
    fhirMedicationRequest.dosageInstruction,
    "MedicationRequest.dosageInstruction"
  ).patientInstruction

  const additionalInstructionsValueObj = {} as ElementCompact
  if (patientInfoText?.length) {
    additionalInstructionsValueObj.patientInfo = patientInfoText
  }
  additionalInstructionsValueObj._text = [controlledDrugWordsWithPrefix, patientInstruction].filter(isTruthy).join("\n")
  const additionalInstructionsValueStr = js2xml(additionalInstructionsValueObj, {compact: true})

  const hl7V3AdditionalInstructions = new prescriptions.AdditionalInstructions(additionalInstructionsValueStr)
  return new prescriptions.LineItemPertinentInformation1(hl7V3AdditionalInstructions)
}

export function convertMedicationRequestToLineItem(
  fhirMedicationRequest: fhir.MedicationRequest,
  repeatNumber: core.Interval<core.Timestamp>,
  patientInfoText: Array<core.Text>
): prescriptions.LineItem {
  const lineItemId = getIdentifierValueForSystem(
    fhirMedicationRequest.identifier,
    "https://fhir.nhs.uk/Id/prescription-order-item-number",
    "MedicationRequest.identifier"
  )
  const hl7V3LineItem = new prescriptions.LineItem(
    new codes.GlobalIdentifier(lineItemId)
  )

  if (repeatNumber) {
    hl7V3LineItem.repeatNumber = repeatNumber
  }

  hl7V3LineItem.product = convertProduct(fhirMedicationRequest.medicationCodeableConcept)
  hl7V3LineItem.component = convertLineItemComponent(fhirMedicationRequest.dispenseRequest.quantity)
  convertPrescriptionEndorsements(fhirMedicationRequest, hl7V3LineItem)

  const pertinentInformation1 = convertAdditionalInstructions(fhirMedicationRequest, patientInfoText)
  if (pertinentInformation1.pertinentAdditionalInstructions.value != "")
    hl7V3LineItem.pertinentInformation1 = pertinentInformation1

  hl7V3LineItem.pertinentInformation2 = convertDosageInstructions(fhirMedicationRequest.dosageInstruction)

  return hl7V3LineItem
}
