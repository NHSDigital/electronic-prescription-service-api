import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach
} from "vitest"
import type {MockInstance} from "vitest"
import {generateSchema} from "../src/utils/generate-schema.js"
import type {ParsedFhirSchema} from "../src/utils/parse-fhir-schema.js"

describe("generateSchema", () => {
  let logSpy: MockInstance
  let infoSpy: MockInstance

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {})
  })

  afterEach(() => {
    logSpy.mockRestore()
    infoSpy.mockRestore()
  })

  it("should produce an empty output for an empty definitions map", () => {
    const input: ParsedFhirSchema = {definitions: {}}
    const result = generateSchema(input)
    expect(result).toEqual({})
  })

  it("should skip $ref reference nodes in allOf", () => {
    const input: ParsedFhirSchema = {
      definitions: {
        TestDef: {
          allOf: [
            {$ref: "#/definitions/Base"}
          ],
          required: []
        }
      }
    }

    const result = generateSchema(input)

    expect(result["TestDef"]).toEqual({
      type: "object",
      properties: {},
      required: []
    })
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("Skipping reference node"))
  })

  it("should skip allOf nodes that are neither references nor bodies", () => {
    const input: ParsedFhirSchema = {
      definitions: {
        TestDef: {
          allOf: [
            {unknownKey: "value"} as any
          ],
          required: []
        }
      }
    }

    const result = generateSchema(input)
    expect(result["TestDef"].properties).toEqual({})
  })

  it("should skip $ref properties within a schema body", () => {
    const input: ParsedFhirSchema = {
      definitions: {
        TestDef: {
          allOf: [
            {
              description: "A body",
              properties: {
                refProp: {$ref: "#/definitions/Other"}
              }
            }
          ],
          required: []
        }
      }
    }

    const result = generateSchema(input)
    expect(result["TestDef"].properties).toEqual({})
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Skipping reference item"))
  })

  it("should map array properties", () => {
    const input: ParsedFhirSchema = {
      definitions: {
        TestDef: {
          allOf: [
            {
              description: "body",
              properties: {
                items: {type: "array", items: {type: "string"}, description: "list"}
              }
            }
          ],
          required: []
        }
      }
    }

    const result = generateSchema(input)
    expect(result["TestDef"].properties["items"]).toEqual({type: "array"})
  })

  it("should map boolean properties", () => {
    const input: ParsedFhirSchema = {
      definitions: {
        TestDef: {
          allOf: [{
            description: "body",
            properties: {
              active: {type: "boolean", description: "Is active"}
            }
          }],
          required: []
        }
      }
    }

    const result = generateSchema(input)
    expect(result["TestDef"].properties["active"]).toEqual({type: "boolean"})
  })

  it("should map number properties with pattern", () => {
    const input: ParsedFhirSchema = {
      definitions: {
        TestDef: {
          allOf: [{
            description: "body",
            properties: {
              count: {type: "number", pattern: "^[0-9]+$", description: "A count"}
            }
          }],
          required: []
        }
      }
    }

    const result = generateSchema(input)
    expect(result["TestDef"].properties["count"]).toEqual({
      type: "number",
      pattern: "^[0-9]+$"
    })
  })

  it("should map enum properties", () => {
    const input: ParsedFhirSchema = {
      definitions: {
        TestDef: {
          allOf: [{
            description: "body",
            properties: {
              status: {type: "string", enum: ["active", "inactive"], description: "Status"}
            }
          }],
          required: []
        }
      }
    }

    const result = generateSchema(input)
    expect(result["TestDef"].properties["status"]).toEqual({
      type: "string",
      enum: ["active", "inactive"]
    })
  })

  it("should map pattern properties", () => {
    const input: ParsedFhirSchema = {
      definitions: {
        TestDef: {
          allOf: [{
            description: "body",
            properties: {
              code: {type: "string", pattern: "^[A-Z]+$", description: "Code"}
            }
          }],
          required: []
        }
      }
    }

    const result = generateSchema(input)
    expect(result["TestDef"].properties["code"]).toEqual({
      type: "string",
      pattern: "^[A-Z]+$"
    })
  })

  it("should track required properties correctly", () => {
    const input: ParsedFhirSchema = {
      definitions: {
        TestDef: {
          allOf: [{
            description: "body",
            properties: {
              active: {type: "boolean", description: "active flag"},
              optional: {type: "boolean", description: "optional flag"}
            }
          }],
          required: ["active"]
        }
      }
    }

    const result = generateSchema(input)
    expect(result["TestDef"].required).toEqual(["active"])
  })

  it("should handle multiple definitions", () => {
    const input: ParsedFhirSchema = {
      definitions: {
        Def1: {
          allOf: [{
            description: "body1",
            properties: {
              field1: {type: "boolean", description: "f1"}
            }
          }],
          required: ["field1"]
        },
        Def2: {
          allOf: [{
            description: "body2",
            properties: {
              field2: {type: "string", enum: ["a"], description: "f2"}
            }
          }],
          required: []
        }
      }
    }

    const result = generateSchema(input)
    expect(Object.keys(result)).toEqual(["Def1", "Def2"])
    expect(result["Def1"].required).toEqual(["field1"])
    expect(result["Def2"].properties["field2"]).toEqual({type: "string", enum: ["a"]})
  })

  it("should return null for unrecognised property shapes", () => {
    const input: ParsedFhirSchema = {
      definitions: {
        TestDef: {
          allOf: [{
            description: "body",
            properties: {
              weird: {someUnknownKey: true}
            }
          }],
          required: []
        }
      }
    }

    const result = generateSchema(input)
    // buildPropertySchema returns null for unrecognised shapes, so property not included
    expect(result["TestDef"].properties["weird"]).toBeUndefined()
  })
})
