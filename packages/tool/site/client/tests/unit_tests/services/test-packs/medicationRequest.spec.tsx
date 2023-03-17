import {getMedicationQuantity} from "../../../../src/services/test-packs/medicationRequests"
import {PrescriptionRow} from "../../../../src/services/test-packs/xls"

describe("getMedicationQuantity", () => {
  test("Correctly parses quantity with integer value", () => {
    const input: Partial<PrescriptionRow> = {
      medicationQuantity: "4"
    }

    expect(getMedicationQuantity(input as PrescriptionRow).value).toEqual(4)
  })
  test("Correctly parses quantity with decimal value", () => {
    const input: Partial<PrescriptionRow> = {
      medicationQuantity: "4.5"
    }

    expect(getMedicationQuantity(input as PrescriptionRow).value).toEqual(4.5)
  })

  test("NaN is parsed as null", () => {
    const input: Partial<PrescriptionRow> = {
      medicationQuantity: "four"
    }

    expect(getMedicationQuantity(input as PrescriptionRow).value).toEqual(null)
  })
})
