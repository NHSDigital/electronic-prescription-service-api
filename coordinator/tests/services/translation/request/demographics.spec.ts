import * as demographics from "../../../../src/services/translation/request/demographics"
import {InvalidValueError} from "../../../../src/models/errors/processing-errors"
import * as hl7V3 from "../../../../src/models/hl7-v3"

describe("convertName fills correct fields only", () => {
  test("should handle empty", () => {
    const fhirName = {}
    const result = demographics.convertName(fhirName, "fhirPath")
    expect(Object.keys(result)).toHaveLength(0)
  })

  const keyCases = [
    ["prefix", {prefix: ["example"]}],
    ["given", {given: ["example"]}],
    ["suffix", {suffix: ["example"]}]
  ]

  test.each(keyCases)("%p should add correct key", (key: string, fhirName:{prefix: Array<string>}) => {
    const result = demographics.convertName(fhirName, "fhirPath")
    expect(Object.keys(result)).toHaveLength(1)
    expect(Object.keys(result)).toContain(key)
  })

  test("family should add correct key", () => {
    const fhirName = {family: "example"}
    const result = demographics.convertName(fhirName, "fhirPath")
    expect(Object.keys(result)).toHaveLength(1)
    expect(Object.keys(result)).toContain("family")
  })

  test("use should add correct key", () => {
    const fhirName = {use: "usual"}
    const result = demographics.convertName(fhirName, "fhirPath")
    expect(Object.keys(result)).toHaveLength(1)
    expect(Object.keys(result)).toContain("_attributes")
  })

  test("passing an object with all keys should add all keys", () => {
    const fhirName = {prefix: ["a"], given: ["b"], family: "c", suffix: ["d"]}
    const result = demographics.convertName(fhirName, "fhirPath")
    expect(Object.keys(result)).toHaveLength(4)
    expect(result.prefix).toEqual([{_text: "a"}])
    expect(result.given).toEqual([{_text: "b"}])
    expect(result.family).toEqual({_text: "c"})
    expect(result.suffix).toEqual([{_text: "d"}])
  })

  const cases = [
    ["usual", hl7V3.NameUse.USUAL],
    ["official", hl7V3.NameUse.USUAL],
    ["temp", hl7V3.NameUse.ALIAS],
    ["anonymous", hl7V3.NameUse.ALIAS],
    ["nickname", hl7V3.NameUse.PREFERRED],
    ["old", hl7V3.NameUse.PREVIOUS],
    ["maiden", hl7V3.NameUse.PREVIOUS_MAIDEN]
  ]

  test.each(cases)("use %p should return correct value", (argument: string, expected: hl7V3.NameUse) => {
    const fhirName = {use: argument}
    const result = demographics.convertName(fhirName, "fhirPath")
    expect(result._attributes).toEqual({use: expected})
  })

  test("Other should throw InvalidValueUserFacingError", () => {
    const fhirName = {"use": "nope"}
    expect(() => demographics.convertName(fhirName, "fhirPath")).toThrow(InvalidValueError)
  })
})

describe("convertTelecom", () => {
  test("should handle empty", () => {
    const fhirTelecom = {}
    const result = demographics.convertTelecom(fhirTelecom, "fhirPath")
    expect(Object.keys(result)).toHaveLength(0)
  })

  const testNumber = "01234567890"

  const fullTranslationExpected = {use: hl7V3.TelecomUse.PERMANENT_HOME, value: `tel:${testNumber}`}
  const cases = [
    [{use: "home"}, {use: hl7V3.TelecomUse.PERMANENT_HOME}],
    [{use: "work"}, {use: hl7V3.TelecomUse.WORKPLACE}],
    [{use: "temp"}, {use: hl7V3.TelecomUse.TEMPORARY}],
    [{use: "mobile"}, {use: hl7V3.TelecomUse.MOBILE}],
    [{use: "home", value: testNumber}, fullTranslationExpected],
    [{use: "home", value: `tel:${testNumber}`}, fullTranslationExpected],
    [{use: "home", value: "0 1 2 3       456 7890"}, fullTranslationExpected]
  ]

  test.each(cases)("%p should translate correctly", (argument, expected) => {
    const result = demographics.convertTelecom(argument, "fhirPath")
    expect(result._attributes).toEqual(expected)
  })
})

describe("convertAddress should return correct addresses", () => {
  test("should handle empty", () => {
    const fhirAddress = {}
    const result = demographics.convertAddress(fhirAddress, "fhirPath")
    expect(Object.keys(result)).toHaveLength(0)
  })

  test("Throw InvalidValueUserFacingError for invalid use", () => {
    const fhirAddress = {use: "example"}
    expect(() => demographics.convertAddress(fhirAddress, "fhirPath")).toThrow(InvalidValueError)
  })

  const cases = [
    ["home", {use: hl7V3.AddressUse.HOME}],
    ["work", {use: hl7V3.AddressUse.WORK}],
    ["temp", {use: hl7V3.AddressUse.TEMPORARY}]
  ]

  test.each(cases)(`address use as %p should return correct value`,
    (argument: string, expected) => {
      const resultHome = demographics.convertAddress({type: "example", use:argument}, "fhirPath")
      expect(resultHome._attributes).toEqual(expected)
    })
})

describe("convertGender should return correct gender", () => {
  const cases = [
    ["male", hl7V3.SexCode.MALE],
    ["female", hl7V3.SexCode.FEMALE],
    ["other", hl7V3.SexCode.INDETERMINATE],
    ["unknown", hl7V3.SexCode.UNKNOWN]
  ]

  test.each(cases)("%p returns correct hl7 gender",
    (actual: string, expected: hl7V3.SexCode) => {
      expect(demographics.convertGender(actual, "fhirPath")).toEqual(expected)
    })

  test("invalid fhirGender throws InvalidValueUserFacingError", () => {
    expect(() => demographics.convertGender("example", "fhirPath")).toThrow(InvalidValueError)
  })
})
