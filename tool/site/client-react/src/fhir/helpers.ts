import * as fhir from "fhir/r4"

export function getMedicationRequestLineItemId(medicationRequest: fhir.MedicationRequest): string {
  return medicationRequest.identifier[0].value
}

export function getMedicationDispenseLineItemId(medicationDispense: fhir.MedicationDispense): string {
  return medicationDispense.authorizingPrescription[0].identifier.value
}

export function getMedicationDispenseId(medicationDispense: fhir.MedicationDispense): string {
  return medicationDispense.identifier[0].value
}

export function getTotalQuantity(quantities: Array<fhir.Quantity>): fhir.Quantity {
  const units = quantities.map(quantity => quantity.unit)
  const values = quantities.map(quantity => quantity.value)
  if (new Set(units).size > 1) {
    throw new Error("Attempting to consolidate quantities with mismatched units")
  }
  return {
    ...quantities[0],
    value: values.reduce((a, b) => a + b)
  }
}
