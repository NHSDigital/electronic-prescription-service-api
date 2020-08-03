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

  test("prefix should add prefix key", () => {
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
})

describe("convertNameUse returns correct use", () => {
  test("usual should return L", () => {
    const fhirName = {"use": "usual"}
    const result = demographics.convertName(fhirName)
    expect(result._attributes).toEqual({use: core.NameUse.USUAL})
  })

  test("official should return L", () => {
    const fhirName = {"use": "official"}
    const result = demographics.convertName(fhirName)
    expect(result._attributes).toEqual({use: core.NameUse.USUAL})
  })

  test("nickname should return A", () => {
    const fhirName = {"use": "nickname"}
    const result = demographics.convertName(fhirName)
    expect(result._attributes).toEqual({use: core.NameUse.ALIAS})
  })

  test("empty should return undefined", () => {
    const fhirName = {}
    const result = demographics.convertName(fhirName)
    expect(result._attributes).toEqual({use: undefined})
  })

  test("Other should throw TypeError", () => {
    const fhirName = {"use": ""}
    expect(() => demographics.convertName(fhirName)).toThrow(TypeError)
  })
})
