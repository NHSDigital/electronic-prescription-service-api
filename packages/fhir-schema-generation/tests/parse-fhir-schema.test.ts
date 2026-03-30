import * as fs from "node:fs"
import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach
} from "vitest"
import type {MockInstance} from "vitest"
import {parseFhirSchema} from "../src/utils/parse-fhir-schema.js"

vi.mock("fs")

describe("parseFhirSchema", () => {
  let logSpy: MockInstance
  let warnSpy: MockInstance

  beforeEach(() => {
    vi.clearAllMocks()
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it("should parse a valid schema file with definitions containing allOf and required", () => {
    const schemaJson = {
      definitions: {
        MedicationRequest: {
          allOf: [
            {$ref: "#/definitions/DomainResource"},
            {
              description: "MedicationRequest body",
              properties: {
                status: {type: "string", description: "status field"}
              },
              required: ["status"]
            }
          ],
          required: ["resourceType", "status"]
        }
      }
    }

    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(schemaJson))

    const result = parseFhirSchema("/some/dir", "MedicationRequest.schema.json")

    expect(result.definitions).toBeDefined()
    expect(result.definitions["MedicationRequest"]).toBeDefined()
    expect(result.definitions["MedicationRequest"].allOf).toHaveLength(2)
    expect(result.definitions["MedicationRequest"].required).toEqual(["resourceType", "status"])
  })

  it("should skip unrecognised allOf nodes and log a warning", () => {
    const schemaJson = {
      definitions: {
        TestDef: {
          allOf: [
            {unknownKey: "some value"} // not a SchemaReference or SchemaBody
          ],
          required: []
        }
      }
    }

    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(schemaJson))

    const result = parseFhirSchema("/dir", "test.schema.json")

    expect(result.definitions["TestDef"].allOf).toHaveLength(0)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Skipping unrecognised allOf node"))
  })

  it("should return empty required array when required is not an array", () => {
    const schemaJson = {
      definitions: {
        TestDef: {
          allOf: [],
          required: "not-an-array"
        }
      }
    }

    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(schemaJson))

    const result = parseFhirSchema("/dir", "test.schema.json")

    expect(result.definitions["TestDef"].required).toEqual([])
  })

  it("should filter non-string items from required array", () => {
    const schemaJson = {
      definitions: {
        TestDef: {
          allOf: [],
          required: ["valid", 123, "alsoValid", null]
        }
      }
    }

    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(schemaJson))

    const result = parseFhirSchema("/dir", "test.schema.json")

    expect(result.definitions["TestDef"].required).toEqual(["valid", "alsoValid"])
  })

  it("should throw when schema file does not parse into an object", () => {
    vi.mocked(fs.readFileSync).mockReturnValue('"just a string"')

    expect(() => parseFhirSchema("/dir", "bad.schema.json"))
      .toThrow("did not parse into an object")
  })

  it("should throw when schema file has no definitions", () => {
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({notDefinitions: {}}))

    expect(() => parseFhirSchema("/dir", "no-def.schema.json"))
      .toThrow("has no definitions")
  })

  it("should skip definitions that are not objects and log a warning", () => {
    const schemaJson = {
      definitions: {
        InvalidDef: "not an object",
        ValidDef: {
          allOf: [],
          required: []
        }
      }
    }

    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(schemaJson))

    const result = parseFhirSchema("/dir", "mixed.schema.json")

    expect(result.definitions["InvalidDef"]).toBeUndefined()
    expect(result.definitions["ValidDef"]).toBeDefined()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Skipping invalid definition"))
  })

  it("should handle empty allOf", () => {
    const schemaJson = {
      definitions: {
        EmptyDef: {
          required: ["id"]
        }
      }
    }

    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(schemaJson))

    const result = parseFhirSchema("/dir", "empty-allof.schema.json")

    expect(result.definitions["EmptyDef"].allOf).toEqual([])
    expect(result.definitions["EmptyDef"].required).toEqual(["id"])
  })
})
