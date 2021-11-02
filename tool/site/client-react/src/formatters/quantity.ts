import * as fhir from "fhir/r4"

export function formatQuantity(quantity: fhir.Quantity): string {
  return [quantity.value, quantity.unit].filter(Boolean).join(" ")
}
