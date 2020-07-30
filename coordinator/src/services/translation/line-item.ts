import * as fhir from "../../model/fhir-resources";
import {getCodingForSystem, getIdentifierValueForSystem, onlyElement} from "./common";
import * as codes from "../../model/hl7-v3-datatypes-codes";
import * as prescriptions from "../../model/hl7-v3-prescriptions";
import * as core from "../../model/hl7-v3-datatypes-core";

function convertProduct(medicationCodeableConcept: fhir.CodeableConcept) {
    const fhirMedicationCode = getCodingForSystem(medicationCodeableConcept.coding, "http://snomed.info/sct")
    const hl7V3MedicationCode = new codes.SnomedCode(fhirMedicationCode.code, fhirMedicationCode.display)
    const manufacturedRequestedMaterial = new prescriptions.ManufacturedRequestedMaterial(hl7V3MedicationCode);
    const manufacturedProduct = new prescriptions.ManufacturedProduct(manufacturedRequestedMaterial);
    return new prescriptions.Product(manufacturedProduct);
}

function convertDosageInstructions(dosageInstruction: Array<fhir.Dosage>) {
    const dosageInstructionsValue = dosageInstruction
        .map(dosageInstruction => dosageInstruction.text)
        .reduce(onlyElement)
    const hl7V3DosageInstructions = new prescriptions.DosageInstructions(dosageInstructionsValue)
    return new prescriptions.LineItemPertinentInformation2(hl7V3DosageInstructions);
}

function convertLineItemComponent(fhirQuantity: fhir.SimpleQuantity) {
    const hl7V3LineItemQuantity = new prescriptions.LineItemQuantity()
    const hl7V3UnitCode = new codes.SnomedCode(fhirQuantity.code, fhirQuantity.unit)
    hl7V3LineItemQuantity.quantity = new core.QuantityInAlternativeUnits(fhirQuantity.value, fhirQuantity.value, hl7V3UnitCode)
    return new prescriptions.LineItemComponent(hl7V3LineItemQuantity);
}

export function convertMedicationRequestToLineItem(fhirMedicationRequest: fhir.MedicationRequest): prescriptions.LineItem {
    const hl7V3LineItem = new prescriptions.LineItem(
        new codes.GlobalIdentifier(getIdentifierValueForSystem(fhirMedicationRequest.identifier, "https://fhir.nhs.uk/Id/prescription-order-item-number"))
    )

    hl7V3LineItem.product = convertProduct(fhirMedicationRequest.medicationCodeableConcept)
    hl7V3LineItem.component = convertLineItemComponent(fhirMedicationRequest.dispenseRequest.quantity)
    hl7V3LineItem.pertinentInformation2 = convertDosageInstructions(fhirMedicationRequest.dosageInstruction)
    return hl7V3LineItem
}
