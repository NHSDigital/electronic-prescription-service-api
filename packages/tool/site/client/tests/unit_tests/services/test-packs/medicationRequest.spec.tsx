import {getMedicationQuantity} from "../../../../src/services/test-packs/medicationRequests"
import {PrescriptionRow} from "../../../../src/services/test-packs/xls"

describe("getMedicationQuantity", () => {
  test("Correctly parses quantity with integer value", () => {
    const input: PrescriptionRow = {
      testId: "1",
      prescriptionTreatmentTypeCode: "acute",
      prescriptionTypeCode: "0101",
      prescriptionTypeDescription:
        "Primary Care Prescriber - Medical Prescriber",
      medicationName: "Aciclovir 3% eye ointment",
      medicationSnomed: "330284003",
      medicationQuantity: "4",
      medicationUnitOfMeasureName: "gram",
      medicationUnitOfMeasureCode: "258682000",
      dosageInstructions: "As directed",
      repeatsAllowed: 0,
      issueDurationInDays: "28",
      dispenserNotes: [],
      nominatedPharmacy: "D7K8P",
      nominatedPharmacyType: "P1",
      endorsements: undefined,
      controlledDrugSchedule: undefined,
      controlledDrugQuantity: undefined,
      additionalInstructions: undefined
    }

    expect(getMedicationQuantity(input).value).toEqual(4)
  })
  test("Correctly parses quantity with decimal value", () => {
    const input: PrescriptionRow = {
      testId: "1",
      prescriptionTreatmentTypeCode: "acute",
      prescriptionTypeCode: "0101",
      prescriptionTypeDescription:
        "Primary Care Prescriber - Medical Prescriber",
      medicationName: "Aciclovir 3% eye ointment",
      medicationSnomed: "330284003",
      medicationQuantity: "4.5",
      medicationUnitOfMeasureName: "gram",
      medicationUnitOfMeasureCode: "258682000",
      dosageInstructions: "As directed",
      repeatsAllowed: 0,
      issueDurationInDays: "28",
      dispenserNotes: [],
      nominatedPharmacy: "D7K8P",
      nominatedPharmacyType: "P1",
      endorsements: undefined,
      controlledDrugSchedule: undefined,
      controlledDrugQuantity: undefined,
      additionalInstructions: undefined
    }

    expect(getMedicationQuantity(input).value).toEqual(4.5)
  })

  test("Handles string", () => {
    const input: PrescriptionRow = {
      testId: "1",
      prescriptionTreatmentTypeCode: "acute",
      prescriptionTypeCode: "0101",
      prescriptionTypeDescription:
        "Primary Care Prescriber - Medical Prescriber",
      medicationName: "Aciclovir 3% eye ointment",
      medicationSnomed: "330284003",
      medicationQuantity: "hello",
      medicationUnitOfMeasureName: "gram",
      medicationUnitOfMeasureCode: "258682000",
      dosageInstructions: "As directed",
      repeatsAllowed: 0,
      issueDurationInDays: "28",
      dispenserNotes: [],
      nominatedPharmacy: "D7K8P",
      nominatedPharmacyType: "P1",
      endorsements: undefined,
      controlledDrugSchedule: undefined,
      controlledDrugQuantity: undefined,
      additionalInstructions: undefined
    }

    expect(getMedicationQuantity(input).value).toEqual(4.5)
  })
})
