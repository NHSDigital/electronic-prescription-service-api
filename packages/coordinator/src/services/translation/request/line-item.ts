import {
  getCodeableConceptCodingForSystem,
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getNumericValueAsString,
  isTruthy,
  onlyElementOrNull
} from "../common"
import {ElementCompact, js2xml} from "xml-js"
import {fhir, hl7V3} from "@models"
import {auditDoseToTextIfEnabled} from "./dosage"
import pino from "pino"
import {getDosageInstruction} from "../../../utils/dosage-instructions"

function convertProduct(fhirMedicationCode: fhir.Coding) {
  const hl7V3MedicationCode = new hl7V3.SnomedCode(fhirMedicationCode.code, fhirMedicationCode.display)
  const manufacturedRequestedMaterial = new hl7V3.ManufacturedRequestedMaterial(hl7V3MedicationCode)
  const manufacturedProduct = new hl7V3.ManufacturedProduct(manufacturedRequestedMaterial)
  return new hl7V3.Product(manufacturedProduct)
}

function convertLineItemComponent(simpleQuantity: fhir.SimpleQuantity) {
  const lineItemQuantity = new hl7V3.LineItemQuantity()
  const unitSnomedCode = new hl7V3.SnomedCode(simpleQuantity.code, simpleQuantity.unit)
  const value = getNumericValueAsString(simpleQuantity.value)
  lineItemQuantity.quantity = new hl7V3.QuantityInAlternativeUnits(value, value, unitSnomedCode)
  return new hl7V3.LineItemComponent(lineItemQuantity)
}

function convertDosageInstructions(dosages: Array<fhir.Dosage>, logger: pino.Logger) {
  // Auditing dose to text result so we can use
  // the resulting translations as evidence for
  // solutions assurance. We're not currently using
  // the translated text in messages to spine
  auditDoseToTextIfEnabled(dosages, logger)

  const dosage = getDosageInstruction(dosages)
  const hl7V3DosageInstructions = new hl7V3.DosageInstructions(dosage)
  return new hl7V3.LineItemPertinentInformation2(hl7V3DosageInstructions)
}

export function convertPrescriptionEndorsements(
  medicationRequest: fhir.MedicationRequest
): Array<hl7V3.LineItemPertinentInformation3> {
  const endorsementExtensions = medicationRequest.extension?.filter(extension =>
    extension.url === "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement"
  ) as Array<fhir.CodeableConceptExtension>

  return endorsementExtensions?.map(endorsementExtension => {
    const endorsementCoding = getCodeableConceptCodingForSystem(
      [endorsementExtension.valueCodeableConcept],
      "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement",
      // eslint-disable-next-line max-len
      'MedicationRequest.extension("https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement").valueCodeableConcept'
    )
    const prescriptionEndorsementValue = new hl7V3.PrescriptionEndorsementCode(endorsementCoding.code)
    const prescriptionEndorsement = new hl7V3.PrescriptionEndorsement(prescriptionEndorsementValue)
    return new hl7V3.LineItemPertinentInformation3(prescriptionEndorsement)
  })
}

function convertAdditionalInstructions(
  medicationRequest: fhir.MedicationRequest,
  medicationListText: Array<hl7V3.Text>,
  patientInfoText: Array<hl7V3.Text>
) {
  const controlledDrugWordsWithPrefix = getControlledDrugWordsWithPrefix(medicationRequest)

  const noteText = onlyElementOrNull(medicationRequest.note, "MedicationRequest.note")?.text

  const additionalInstructionsValueStr = assembleAdditionalInstructionsValueFromParts(
    medicationListText,
    patientInfoText,
    controlledDrugWordsWithPrefix,
    noteText
  )
  if (!additionalInstructionsValueStr) {
    return null
  }

  const additionalInstructions = new hl7V3.AdditionalInstructions(additionalInstructionsValueStr)
  return new hl7V3.LineItemPertinentInformation1(additionalInstructions)
}

function getControlledDrugWordsWithPrefix(medicationRequest: fhir.MedicationRequest) {
  const controlledDrugExtension = getExtensionForUrlOrNull(
    medicationRequest.extension,
    "https://fhir.nhs.uk/StructureDefinition/Extension-DM-ControlledDrug",
    "MedicationRequest.extension"
  ) as fhir.ControlledDrugExtension
  if (!controlledDrugExtension) {
    return null
  }

  const controlledDrugWordsExtension = getExtensionForUrlOrNull(
    controlledDrugExtension.extension,
    "quantityWords",
    'MedicationRequest.extension("https://fhir.nhs.uk/StructureDefinition/Extension-DM-ControlledDrug").extension'
  ) as fhir.StringExtension
  if (!controlledDrugWordsExtension) {
    return null
  }

  const controlledDrugWords = controlledDrugWordsExtension.valueString
  if (!controlledDrugWords) {
    return null
  }

  return `CD: ${controlledDrugWords}`
}

function assembleAdditionalInstructionsValueFromParts(
  medicationListText: Array<hl7V3.Text>,
  patientInfoText: Array<hl7V3.Text>,
  controlledDrugWordsWithPrefix: string,
  noteText: string
) {
  const additionalInstructionsValueObj: ElementCompact = {}

  if (medicationListText?.length) {
    additionalInstructionsValueObj.medication = medicationListText
  }

  if (patientInfoText?.length) {
    additionalInstructionsValueObj.patientInfo = patientInfoText
  }

  additionalInstructionsValueObj._text = [controlledDrugWordsWithPrefix, noteText].filter(isTruthy).join("\n")

  return js2xml(additionalInstructionsValueObj, {compact: true})
}

export function convertMedicationRequestToLineItem(
  medicationRequest: fhir.MedicationRequest,
  repeatNumber: hl7V3.Interval<hl7V3.Timestamp>,
  medicationListText: Array<hl7V3.Text>,
  patientInfoText: Array<hl7V3.Text>,
  medicationCoding: fhir.Coding,
  logger: pino.Logger
): hl7V3.LineItem {
  const lineItemId = getIdentifierValueForSystem(
    medicationRequest.identifier,
    "https://fhir.nhs.uk/Id/prescription-order-item-number",
    "MedicationRequest.identifier"
  )
  const lineItem = new hl7V3.LineItem(
    new hl7V3.GlobalIdentifier(lineItemId)
  )

  if (repeatNumber) {
    lineItem.repeatNumber = repeatNumber
  }

  lineItem.product = convertProduct(medicationCoding)
  lineItem.component = convertLineItemComponent(medicationRequest.dispenseRequest.quantity)

  const pertinentInformation1 = convertAdditionalInstructions(medicationRequest, medicationListText, patientInfoText)
  if (pertinentInformation1) {
    lineItem.pertinentInformation1 = pertinentInformation1
  }

  const pertinentInformation3 = convertPrescriptionEndorsements(medicationRequest)
  if (pertinentInformation3?.length) {
    lineItem.pertinentInformation3 = pertinentInformation3
  }

  lineItem.pertinentInformation2 = convertDosageInstructions(medicationRequest.dosageInstruction, logger)

  return lineItem
}
