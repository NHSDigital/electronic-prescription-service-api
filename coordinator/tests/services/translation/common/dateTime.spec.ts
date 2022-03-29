import {isFutureDated} from "../../../../src/services/translation/common/dateTime"

describe("dateTime", () => {
  test("isFutureDate", () => {
    const pastDate = "1999-01-01"
    const futureDate = "2100-01-01"

    expect(isFutureDated(pastDate)).toBeFalsy()
    expect(isFutureDated(futureDate)).toBeTruthy()
  })
})
