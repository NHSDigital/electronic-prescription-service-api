import * as demographics from "../../../src/services/translation/demographics"
import * as core from "../../../src/model/hl7-v3-datatypes-core"
import * as codes from "../../../src/model/hl7-v3-datatypes-codes"

describe("convertName fills correct fields only", () => {
  test("no keys should add no keys", () => {
    const fhirName = {}
    const result = demographics.convertName(fhirName)
    expect(Object.keys(result)).toHaveLength(1)
    expect(result._attributes).toEqual({"use": undefined})
  })

  const keyCases = [
    ["prefix", {prefix: ["example"]}],
    ["given", {given: ["example"]}],
    ["suffix", {suffix: ["example"]}]]

  test.each(keyCases)("%p should add correct key", (key: string, fhirName:{prefix: string[]}) => {
    const result = demographics.convertName(fhirName)
    expect(Object.keys(result)).toHaveLength(2)
    expect(Object.keys(result)).toContain(key)
  })

  test("family should add correct key", () => {
    const family = "example"
    const fhirName = {family: family}
    const result = demographics.convertName(fhirName)
    expect(Object.keys(result)).toHaveLength(2)
    expect(Object.keys(result)).toContain("family")
  })

  test("passing an object with all keys should add all keys", () => {
    const fhirName = {prefix: [""], given: [""], family: "", suffix: [""]}
    const result = demographics.convertName(fhirName)
    expect(Object.keys(result)).toHaveLength(5)
    expect(result.prefix).toEqual([{_text: ""}])
    expect(result.given).toEqual([{_text: ""}])
    expect(result.family).toEqual({_text: ""})
    expect(result.suffix).toEqual([{_text: ""}])
  })

  const cases = [
    ["usual", core.NameUse.USUAL],
    ["official", core.NameUse.USUAL],
    ["nickname", core.NameUse.ALIAS]]

  test.each(cases)("use %p should return correct value", (argument: string, expected: core.NameUse) => {
    const fhirName = {use: argument}
    const result = demographics.convertName(fhirName)
    expect(result._attributes).toEqual({use: expected})
  })

  test("Other should throw TypeError", () => {
    const fhirName = {"use": ""}
    expect(() => demographics.convertName(fhirName)).toThrow(TypeError)
  })
})

describe("convertTelecom should convert correct use", () => {
  test("empty telecom should throw TypeError", () => {
    const fhirTelecom = {}
    expect(() => demographics.convertTelecom(fhirTelecom)).toThrow(TypeError)
  })

  const cases = [
    ["home", core.TelecomUse.PERMANENT_HOME],
    ["work", core.TelecomUse.WORKPLACE],
    ["temp", core.TelecomUse.TEMPORARY],
    ["mobile", core.TelecomUse.MOBILE]]

  test.each(cases)("%p should return correct value", (argument: string, expected: core.TelecomUse) => {
    const fhirTelecom = {use: argument}
    const result = demographics.convertTelecom(fhirTelecom)
    expect(result._attributes).toEqual({use: expected})
  })
})

describe("convertAddress should return correct addresses", () => {
  test("Throw TypeError when no type and invalid use", () => {
    const fhirAddress = {use: "example"}
    expect(() => demographics.convertAddress(fhirAddress)).toThrow(TypeError)
  })

  test("Empty address type and use do not add an _attributes key", () => {
    const fhirAddress = {}
    const result = demographics.convertAddress(fhirAddress)
    expect(Object.keys(result)).not.toContain("_attributes")
  })

  const cases = [
    ["home", {use: core.AddressUse.HOME}],
    ["work", {use: core.AddressUse.WORK}],
    ["temp", {use: core.AddressUse.TEMPORARY}]]

  test.each(cases)("address type as postal and use as %p should return use as core.AddressUse.POSTAL", (argument: string) => {
    const fhirAddress = {type: "postal", use:argument}
    const result = demographics.convertAddress(fhirAddress)
    expect(result._attributes).toEqual({use: core.AddressUse.POSTAL})
  })

  test.each(cases)(`address type not postal and use as %p should return correct value`,
    (argument: string, expected) => {
      const resultHome = demographics.convertAddress({type: "example", use:argument})
      expect(resultHome._attributes).toEqual(expected)
    })
})

describe("convertGender should return correct gender", () => {
  const cases = [
    ["male", codes.SexCode.MALE],
    ["female", codes.SexCode.FEMALE],
    ["other", codes.SexCode.INDETERMINATE],
    ["unknown", codes.SexCode.UNKNOWN]]

  test.each(cases)("%p returns correct hl7 gender",
    (actual:string, expected: codes.SexCode) => {
      expect(demographics.convertGender(actual)).toEqual(expected)
    })

  test("invalid fhirGender throws TypeError", () => {
    expect(() => demographics.convertGender("example")).toThrow(TypeError)
  })
})
