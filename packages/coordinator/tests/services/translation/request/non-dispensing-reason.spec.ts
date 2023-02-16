
import {mapNonDispensingReason} from "../../../../src/services/translation/request/non-dispensing-reason"
import {NonDispensingReason} from "../../../../../models/hl7-v3"
import {InvalidValueError} from "../../../../../models/errors/processing-errors"

describe("non-dispensing-reason", () => {
  test("maps valid values successfully", () => {
    const expected = new NonDispensingReason("0010")
    const result = mapNonDispensingReason("0001")
    expect(result).toEqual(expected)
  })

  test("throws expected error when invalid mapping", () => {
    expect(() =>
      mapNonDispensingReason("01234")
    ).toThrow(InvalidValueError)
  })
})
