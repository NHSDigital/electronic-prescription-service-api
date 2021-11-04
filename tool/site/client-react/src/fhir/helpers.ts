import * as fhir from "fhir/r4"
import {MedicationRequest} from "fhir/r4"
import {getUkCoreNumberOfRepeatsAllowedExtension, getUkCoreNumberOfRepeatsIssuedExtension} from "./customExtensions"
import * as uuid from "uuid"

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

export function getRepeatsIssuedAndAllowed(medicationRequest: MedicationRequest): [number, number] {
  const ukCoreRepeatsIssuedExtension = getUkCoreNumberOfRepeatsIssuedExtension(medicationRequest.extension)
  const numberOfRepeatPrescriptionsIssued = ukCoreRepeatsIssuedExtension
    ? ukCoreRepeatsIssuedExtension.valueUnsignedInt
    : 1

  const ukCoreRepeatsAllowedExtension = getUkCoreNumberOfRepeatsAllowedExtension(medicationRequest.extension)
  const numberOfRepeatPrescriptionsAllowed = ukCoreRepeatsAllowedExtension
    ? ukCoreRepeatsAllowedExtension.valueUnsignedInt
    : (medicationRequest.dispenseRequest.numberOfRepeatsAllowed || 0) + 1

  return [numberOfRepeatPrescriptionsIssued, numberOfRepeatPrescriptionsAllowed]
}

export function createUuidIdentifier(): fhir.Identifier {
  return {
    system: "https://tools.ietf.org/html/rfc4122",
    value: uuid.v4()
  }
}
