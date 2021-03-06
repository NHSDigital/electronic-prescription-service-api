import * as demographics from "../../../src/services/translation/prescription/demographics"
import * as core from "../../../src/models/hl7-v3/hl7-v3-datatypes-core"
import * as codes from "../../../src/models/hl7-v3/hl7-v3-datatypes-codes"
import * as XmlJs from "xml-js"
import {InvalidValueError} from "../../../src/models/errors/processing-errors"

describe("convertName fills correct fields only", () => {
  test("no keys should add no keys", () => {
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
    ["usual", core.NameUse.USUAL],
    ["official", core.NameUse.USUAL],
    ["temp", core.NameUse.ALIAS],
    ["anonymous", core.NameUse.ALIAS],
    ["nickname", core.NameUse.PREFERRED],
    ["old", core.NameUse.PREVIOUS],
    ["maiden", core.NameUse.PREVIOUS_MAIDEN]
  ]

  test.each(cases)("use %p should return correct value", (argument: string, expected: core.NameUse) => {
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
  test("empty telecom should throw InvalidValueUserFacingError", () => {
    const fhirTelecom = {}
    expect(() => demographics.convertTelecom(fhirTelecom, "fhirPath")).toThrow(InvalidValueError)
  })

  const testNumber = "01234567890"

  const fullTranslationExpected = {use: core.TelecomUse.PERMANENT_HOME, value: `tel:${testNumber}`}
  const cases = [
    [{use: "home"}, {use: core.TelecomUse.PERMANENT_HOME}],
    [{use: "work"}, {use: core.TelecomUse.WORKPLACE}],
    [{use: "temp"}, {use: core.TelecomUse.TEMPORARY}],
    [{use: "mobile"}, {use: core.TelecomUse.MOBILE}],
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
  test("Throw InvalidValueUserFacingError when no type and invalid use", () => {
    const fhirAddress = {use: "example"}
    expect(() => demographics.convertAddress(fhirAddress, "fhirPath")).toThrow(InvalidValueError)
  })

  test("Empty address type and use do not add any attributes to the address XML tag", () => {
    const fhirAddress = {}
    const options = {compact: true}
    const result = demographics.convertAddress(fhirAddress, "fhirPath")
    expect(XmlJs.js2xml({address: result}, options)).toBe("<address></address>")
  })

  const cases = [
    ["home", {use: core.AddressUse.HOME}],
    ["work", {use: core.AddressUse.WORK}],
    ["temp", {use: core.AddressUse.TEMPORARY}]
  ]

  test.each(cases)(`address use as %p should return correct value`,
    (argument: string, expected) => {
      const resultHome = demographics.convertAddress({type: "example", use:argument}, "fhirPath")
      expect(resultHome._attributes).toEqual(expected)
    })
})

describe("convertGender should return correct gender", () => {
  const cases = [
    ["male", codes.SexCode.MALE],
    ["female", codes.SexCode.FEMALE],
    ["other", codes.SexCode.INDETERMINATE],
    ["unknown", codes.SexCode.UNKNOWN]
  ]

  test.each(cases)("%p returns correct hl7 gender",
    (actual:string, expected: codes.SexCode) => {
      expect(demographics.convertGender(actual, "fhirPath")).toEqual(expected)
    })

  test("invalid fhirGender throws InvalidValueUserFacingError", () => {
    expect(() => demographics.convertGender("example", "fhirPath")).toThrow(InvalidValueError)
  })
})
