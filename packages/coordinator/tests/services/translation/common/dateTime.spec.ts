import {
  convertHL7V3DateTimeStringToFhirDate,
  convertHL7V3DateTimeStringToFhirDateTime,
  isDateInRange,
  isFutureDated
} from "../../../../src/services/translation/common/dateTime"

describe("dateTime", () => {
  test("isFutureDate", () => {
    const pastDate = "1999-01-01"
    const futureDate = "2100-01-01"

    expect(isFutureDated(pastDate)).toBeFalsy()
    expect(isFutureDated(futureDate)).toBeTruthy()
  })
})

describe("isDateInRange", () => {
  const startDate = new Date("Jul 15 14:52:47 2021 GMT")
  const endDate = new Date("Jul 21 14:52:47 2021 GMT")
  test("should return true when date is between startDate and endDate", () => {
    const dateInRange = new Date("Jul 17 14:52:47 2021 GMT")
    const result = isDateInRange(dateInRange, startDate, endDate)
    expect(result).toBeTruthy()
  })
  test("should return false when date is not before start date", () => {
    const dateBeforeStartDate = new Date("Jul 13 14:52:47 2021 GMT")
    const result = isDateInRange(dateBeforeStartDate, startDate, endDate)
    expect(result).toBeFalsy()
  })

  test("should return false when date is after end date", () => {
    const dateAfterStartDate = new Date("Jul 24 14:52:47 2021 GMT")
    const result = isDateInRange(dateAfterStartDate, startDate, endDate)
    expect(result).toBeFalsy()
  })
})

describe("HL7v3 datetime string conversion", () => {
  test("HL7v3 datetime string converted successfully to date", () => {
    const dateTimeString = "20230321150405"
    const result = convertHL7V3DateTimeStringToFhirDate(dateTimeString)
    expect(result).toEqual("2023-03-21")
  })

  test("HL7v3 datetime string converted successfully to datetime", () => {
    const dateTimeString = "20230321150405"
    const result = convertHL7V3DateTimeStringToFhirDateTime(dateTimeString)
    expect(result).toEqual("2023-03-21T15:04:05+00:00")
  })
})
