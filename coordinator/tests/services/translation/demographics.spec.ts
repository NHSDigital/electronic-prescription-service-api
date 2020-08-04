import * as demographics from "../../../src/services/translation/demographics"
import * as core from "../../../src/model/hl7-v3-datatypes-core"

describe("convertName fills correct fields only", () => {
  test("no keys should add no keys", () => {
    const fhirName = {}
    const result = demographics.convertName(fhirName)
    expect(Object.keys(result)).toHaveLength(1)
    expect(result._attributes).toEqual({"use": undefined})
  })

  test("prefix should add prefix key", () => {
    const prefix = "example"
    const fhirName = {prefix: [prefix]}
    const result = demographics.convertName(fhirName)
    expect(Object.keys(result)).toHaveLength(2)
    expect(result.prefix).toEqual([{_text: prefix}])
  })

  test("given should add given key", () => {
    const given = "example"
    const fhirName = {given: [given]}
    const result = demographics.convertName(fhirName)
    expect(Object.keys(result)).toHaveLength(2)
    expect(result.given).toEqual([{_text: given}])
  })
  test("family should add family key", () => {
    const family = "example"
    const fhirName = {family: family}
    const result = demographics.convertName(fhirName)
    expect(Object.keys(result)).toHaveLength(2)
    expect(result.family).toEqual({_text: family})
  })

  test("suffix should add suffix key", () => {
    const suffix = "example"
    const fhirName = {suffix: [suffix]}
    const result = demographics.convertName(fhirName)
    expect(Object.keys(result)).toHaveLength(2)
    expect(result.suffix).toEqual([{_text: suffix}])
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

  test("usual should return USUAL", () => {
    const fhirName = {"use": "usual"}
    const result = demographics.convertName(fhirName)
    expect(result._attributes).toEqual({use: core.NameUse.USUAL})
  })

  test("official should return USUAL", () => {
    const fhirName = {"use": "official"}
    const result = demographics.convertName(fhirName)
    expect(result._attributes).toEqual({use: core.NameUse.USUAL})
  })

  test("nickname should return ALIAS", () => {
    const fhirName = {"use": "nickname"}
    const result = demographics.convertName(fhirName)
    expect(result._attributes).toEqual({use: core.NameUse.ALIAS})
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

  test("home should return PERMANENT_HOME", () => {
    const fhirTelecom = {use: "home"}
    const result = demographics.convertTelecom(fhirTelecom)
    expect(result._attributes).toEqual({use: core.TelecomUse.PERMANENT_HOME})
  })

  test("work should return WORKPLACE", () => {
    const fhirTelecom = {use: "work"}
    const result = demographics.convertTelecom(fhirTelecom)
    expect(result._attributes).toEqual({use: core.TelecomUse.WORKPLACE})
  })

  test("temp should return TEMPORARY", () => {
    const fhirTelecom = {use: "temp"}
    const result = demographics.convertTelecom(fhirTelecom)
    expect(result._attributes).toEqual({use: core.TelecomUse.TEMPORARY})
  })

  test("mobile should return MOBILE", () => {
    const fhirTelecom = {use: "mobile"}
    const result = demographics.convertTelecom(fhirTelecom)
    expect(result._attributes).toEqual({use: core.TelecomUse.MOBILE})
  })
})

describe("convertAddress should return correct addresses", () => {
  test("empty address should throw TypeError", () => {
    const fhirAddress = {}
    expect(() => demographics.convertAddress(fhirAddress)).toThrow(TypeError)
  })

  test("address type as postal should return ", () => {
    const fhirAddress = {type: "postal"}
    const result = demographics.convertAddress(fhirAddress)
    expect(result).toEqual({_attributes: {use: "postal"}})
  })
})
