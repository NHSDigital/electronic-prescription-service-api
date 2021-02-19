import {
  getCodingForSystem,
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getNumericValueAsString,
  isTruthy,
  onlyElement
} from "../common"
import {ElementCompact, js2xml} from "xml-js"
import * as hl7V3 from "../../../models/hl7-v3"
import * as fhir from "../../../models/fhir"

function convertProduct(medicationCodeableConcept: fhir.CodeableConcept) {
  const fhirMedicationCode = getCodingForSystem(
    medicationCodeableConcept.coding,
    "http://snomed.info/sct",
    "MedicationRequest.medicationCodeableConcept.coding"
  )
  const hl7V3MedicationCode = new hl7V3.SnomedCode(fhirMedicationCode.code, fhirMedicationCode.display)
  const manufacturedRequestedMaterial = new hl7V3.ManufacturedRequestedMaterial(hl7V3MedicationCode)
  const manufacturedProduct = new hl7V3.ManufacturedProduct(manufacturedRequestedMaterial)
  return new hl7V3.Product(manufacturedProduct)
}

function convertLineItemComponent(fhirQuantity: fhir.SimpleQuantity) {
  const hl7V3LineItemQuantity = new hl7V3.LineItemQuantity()
  const hl7V3UnitCode = new hl7V3.SnomedCode(fhirQuantity.code, fhirQuantity.unit)
  const value = getNumericValueAsString(fhirQuantity.value)
  hl7V3LineItemQuantity.quantity = new hl7V3.QuantityInAlternativeUnits(value, value, hl7V3UnitCode)
  return new hl7V3.LineItemComponent(hl7V3LineItemQuantity)
}

function convertDosageInstructions(dosageInstruction: Array<fhir.Dosage>) {
  const dosageInstructionsValue = onlyElement(
    dosageInstruction,
    "MedicationRequest.dosageInstruction"
  ).text
  const hl7V3DosageInstructions = new hl7V3.DosageInstructions(dosageInstructionsValue)
  return new hl7V3.LineItemPertinentInformation2(hl7V3DosageInstructions)
}

export function convertPrescriptionEndorsements(
  fhirMedicationRequest: fhir.MedicationRequest,
  hl7V3LineItem: hl7V3.LineItem
): void {
  const fhirMedicationPrescriptionEndorsementExtension = getExtensionForUrlOrNull(
    fhirMedicationRequest.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement",
    "MedicationRequest.extension"
  ) as fhir.CodeableConceptExtension

  if (fhirMedicationPrescriptionEndorsementExtension) {
    hl7V3LineItem.pertinentInformation3 = fhirMedicationPrescriptionEndorsementExtension.valueCodeableConcept.coding
      .map(coding => {
        const prescriptionEndorsementValue = new hl7V3.PrescriptionEndorsementCode(coding.code)
        const prescriptionEndorsement = new hl7V3.PrescriptionEndorsement(prescriptionEndorsementValue)
        return new hl7V3.LineItemPertinentInformation3(prescriptionEndorsement)
      })
  } else {
    delete hl7V3LineItem.pertinentInformation3
  }
}

function convertAdditionalInstructions(
  fhirMedicationRequest: fhir.MedicationRequest,
  medicationListText: Array<hl7V3.Text>,
  patientInfoText: Array<hl7V3.Text>
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
  if (medicationListText?.length) {
    additionalInstructionsValueObj.medication = medicationListText
  }
  if (patientInfoText?.length) {
    additionalInstructionsValueObj.patientInfo = patientInfoText
  }
  additionalInstructionsValueObj._text = [controlledDrugWordsWithPrefix, patientInstruction].filter(isTruthy).join("\n")
  const additionalInstructionsValueStr = js2xml(additionalInstructionsValueObj, {compact: true})

  const hl7V3AdditionalInstructions = new hl7V3.AdditionalInstructions(additionalInstructionsValueStr)
  return new hl7V3.LineItemPertinentInformation1(hl7V3AdditionalInstructions)
}

export function convertMedicationRequestToLineItem(
  fhirMedicationRequest: fhir.MedicationRequest,
  repeatNumber: hl7V3.Interval<hl7V3.Timestamp>,
  medicationListText: Array<hl7V3.Text>,
  patientInfoText: Array<hl7V3.Text>
): hl7V3.LineItem {
  const lineItemId = getIdentifierValueForSystem(
    fhirMedicationRequest.identifier,
    "https://fhir.nhs.uk/Id/prescription-order-item-number",
    "MedicationRequest.identifier"
  )
  const hl7V3LineItem = new hl7V3.LineItem(
    new hl7V3.GlobalIdentifier(lineItemId)
  )

  if (repeatNumber) {
    hl7V3LineItem.repeatNumber = repeatNumber
  }

  hl7V3LineItem.product = convertProduct(fhirMedicationRequest.medicationCodeableConcept)
  hl7V3LineItem.component = convertLineItemComponent(fhirMedicationRequest.dispenseRequest.quantity)
  convertPrescriptionEndorsements(fhirMedicationRequest, hl7V3LineItem)

  const pertinentInformation1 = convertAdditionalInstructions(
    fhirMedicationRequest,
    medicationListText,
    patientInfoText
  )
  if (pertinentInformation1.pertinentAdditionalInstructions.value._text) {
    hl7V3LineItem.pertinentInformation1 = pertinentInformation1
  }

  hl7V3LineItem.pertinentInformation2 = convertDosageInstructions(fhirMedicationRequest.dosageInstruction)

  return hl7V3LineItem
}
