import {
  getCodeableConceptCodingForSystem,
  getExtensionForUrlOrNull,
  getIdentifierValueForSystem,
  getNumericValueAsString,
  isTruthy,
  onlyElement
} from "../common"
import {ElementCompact, js2xml} from "xml-js"
import {fhir, hl7V3} from "@models"

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

function convertDosageInstructions(dosages: Array<fhir.Dosage>) {
  const dosage = onlyElement(
    dosages,
    "MedicationRequest.dosageInstruction"
  ).text
  const hl7V3DosageInstructions = new hl7V3.DosageInstructions(dosage)
  return new hl7V3.LineItemPertinentInformation2(hl7V3DosageInstructions)
}

export function convertPrescriptionEndorsements(
  medicationRequest: fhir.MedicationRequest,
  lineItem: hl7V3.LineItem
): void {
  const endorsementExtensions = medicationRequest.extension?.filter(
    extension => extension.url === "https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement"
  ) as Array<fhir.CodeableConceptExtension>

  if (endorsementExtensions?.length) {
    lineItem.pertinentInformation3 = endorsementExtensions.map(endorsementExtension => {
      const endorsementCoding = getCodeableConceptCodingForSystem(
        [endorsementExtension.valueCodeableConcept],
        "https://fhir.nhs.uk/CodeSystem/medicationrequest-endorsement",
        // eslint-disable-next-line max-len
        "MedicationRequest.extension(https://fhir.nhs.uk/StructureDefinition/Extension-DM-PrescriptionEndorsement).valueCodeableConcept"
      )
      const prescriptionEndorsementValue = new hl7V3.PrescriptionEndorsementCode(endorsementCoding.code)
      const prescriptionEndorsement = new hl7V3.PrescriptionEndorsement(prescriptionEndorsementValue)
      return new hl7V3.LineItemPertinentInformation3(prescriptionEndorsement)
    })
  } else {
    delete lineItem.pertinentInformation3
  }
}

function convertAdditionalInstructions(
  medicationRequest: fhir.MedicationRequest,
  medicationListText: Array<hl7V3.Text>,
  patientInfoText: Array<hl7V3.Text>
) {
  const controlledDrugExtension = getExtensionForUrlOrNull(
    medicationRequest.extension,
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
    medicationRequest.dosageInstruction,
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

  const additionalInstructions = new hl7V3.AdditionalInstructions(additionalInstructionsValueStr)
  return new hl7V3.LineItemPertinentInformation1(additionalInstructions)
}

export function convertMedicationRequestToLineItem(
  medicationRequest: fhir.MedicationRequest,
  repeatNumber: hl7V3.Interval<hl7V3.Timestamp>,
  medicationListText: Array<hl7V3.Text>,
  patientInfoText: Array<hl7V3.Text>,
  medicationCoding: fhir.Coding
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
  convertPrescriptionEndorsements(medicationRequest, lineItem)

  const pertinentInformation1 = convertAdditionalInstructions(
    medicationRequest,
    medicationListText,
    patientInfoText
  )
  if (pertinentInformation1.pertinentAdditionalInstructions.value._text) {
    lineItem.pertinentInformation1 = pertinentInformation1
  }

  lineItem.pertinentInformation2 = convertDosageInstructions(medicationRequest.dosageInstruction)

  return lineItem
}
