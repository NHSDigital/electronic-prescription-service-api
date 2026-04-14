import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import {
  beforeAll,
  describe,
  expect,
  it
} from "vitest"

import {generateSchema, applyCardinality} from "../src/utils/generate-schema.js"
import {StructureDefinition} from "../src/models/fhir-package/structure-definition.interface.js"

let tmpDir: string

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "generate-schema-test-"))

  // shared dependency used by multiple tests
  writeDefinition("code", {
    resourceType: "StructureDefinition",
    id: "code",
    name: "code",
    kind: "primitive-type",
    type: "boolean",
    snapshot: {element: []}
  })
})

function buildDefinition(overrides: Partial<StructureDefinition>): StructureDefinition {
  const definition: StructureDefinition = {
    resourceType: "StructureDefinition",
    id: "Test",
    meta: {lastUpdated: "2024-01-01"},
    extension: [{url: "", valueString: ""}],
    url: "",
    version: "1.0.0",
    name: "Test",
    status: "active",
    date: "",
    publisher: "",
    contact: "",
    description: "",
    fhirVersion: "4.0.1",
    mapping: "",
    kind: "resource",
    abstract: "false",
    type: "Test",
    baseDefinition: "",
    derivation: "",
    snapshot: {element: []},
    differential: {element: []},
    ...overrides
  }
  return definition
}

function writeDefinition(name: string, content: Record<string, unknown>): void {
  fs.writeFileSync(
    path.join(tmpDir, `StructureDefinition-${name}.json`),
    JSON.stringify(content),
    "utf-8"
  )
}

function element(id: string, code: string, min: number, max: string): Record<string, unknown> {
  return {id, path: id, min, max, type: [{code}]}
}

describe("generateSchema", () => {
  it("maps a string primitive with pattern", () => {
    const sd = buildDefinition({
      id: "MyPrimitive",
      name: "MyPrimitive",
      kind: "primitive-type",
      type: "string",
      snapshot: {
        element: [{
          id: "MyPrimitive", path: "MyPrimitive", short: "", definition: "", comment: "",
          min: 0, max: "1",
          type: [{code: "string", extension: [{url: "", valueString: "^[a-z]+$"}]}],
          mapping: []
        }]
      } as any
    })

    const result = generateSchema(sd, tmpDir)

    expect(result.MyPrimitive).toEqual({type: "string", pattern: "^[a-z]+$"})
  })

  it("maps a boolean primitive", () => {
    const sd = buildDefinition({
      id: "MyBool", name: "MyBool",
      kind: "primitive-type", type: "boolean",
      snapshot: {element: []} as any
    })

    const result = generateSchema(sd, tmpDir)

    expect(result.MyBool).toEqual({type: "boolean", pattern: undefined})
  })

  it("returns empty record for unsupported kinds", () => {
    const sd = buildDefinition({id: "L", name: "L", kind: "logical" as any})

    const result = generateSchema(sd, tmpDir)

    expect(Object.keys(result)).toHaveLength(0)
  })

  it("resolves dependencies from the package directory", () => {
    const sd = buildDefinition({
      id: "MyResource", name: "MyResource", kind: "resource",
      snapshot: {
        element: [
          {id: "MyResource", path: "MyResource"},
          element("MyResource.status", "code", 1, "1")
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)

    expect(result.MyResource).toEqual({
      title: "MyResource",
      type: "object",
      properties: {status: {type: "boolean", pattern: undefined}},
      required: ["status"]
    })
  })

  it("wraps unbounded array fields with minItems only", () => {
    writeDefinition("Identifier", {
      resourceType: "StructureDefinition",
      id: "Identifier", name: "Identifier",
      kind: "primitive-type", type: "boolean",
      snapshot: {element: []}
    })

    const sd = buildDefinition({
      id: "ArrayResource", name: "ArrayResource", kind: "resource",
      snapshot: {
        element: [
          {id: "ArrayResource", path: "ArrayResource"},
          element("ArrayResource.identifier", "Identifier", 0, "*")
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)

    expect(result.ArrayResource.properties.identifier).toEqual({
      type: "array",
      items: {type: "boolean", pattern: undefined},
      minItems: 0
    })
  })

  it("wraps bounded array fields with minItems and maxItems", () => {
    const sd = buildDefinition({
      id: "BoundedResource", name: "BoundedResource", kind: "resource",
      snapshot: {
        element: [
          {id: "BoundedResource", path: "BoundedResource"},
          element("BoundedResource.telecom", "code", 1, "3")
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)

    expect(result.BoundedResource.properties.telecom).toEqual({
      type: "array",
      items: {type: "boolean", pattern: undefined},
      minItems: 1,
      maxItems: 3
    })
    expect(result.BoundedResource.required).toContain("telecom")
  })

  it("does not wrap singular fields in an array", () => {
    const sd = buildDefinition({
      id: "SingleResource", name: "SingleResource", kind: "resource",
      snapshot: {
        element: [
          {id: "SingleResource", path: "SingleResource"},
          element("SingleResource.status", "code", 0, "1")
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)

    expect(result.SingleResource.properties.status).toEqual({type: "boolean", pattern: undefined})
    expect(result.SingleResource.required).toBeUndefined()
  })

  it("marks fields with min > 0 as required", () => {
    const sd = buildDefinition({
      id: "ReqResource", name: "ReqResource", kind: "resource",
      snapshot: {
        element: [
          {id: "ReqResource", path: "ReqResource"},
          element("ReqResource.name", "code", 1, "1"),
          element("ReqResource.description", "code", 0, "1")
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)

    expect(result.ReqResource.required).toEqual(["name"])
  })

  it("skips elements with empty id or matching root name", () => {
    const sd = buildDefinition({
      id: "EmptyIdResource", name: "", kind: "resource",
      snapshot: {element: [{id: "", path: ""}]} as any
    })

    const result = generateSchema(sd, tmpDir)

    expect(result.EmptyIdResource.properties).toEqual({})
  })

  it("skips elements whose type cannot be resolved", () => {
    const sd = buildDefinition({
      id: "UnresolvableResource", name: "UnresolvableResource", kind: "resource",
      snapshot: {
        element: [
          {id: "UnresolvableResource", path: "UnresolvableResource"},
          element("UnresolvableResource.mystery", "NonExistentType", 1, "1")
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)

    expect(result.UnresolvableResource.properties).toEqual({})
    expect(result.UnresolvableResource.required).toEqual(["mystery"])
  })

  it("handles circular references with $ref instead of infinite recursion", () => {
    writeDefinition("Extension", {
      resourceType: "StructureDefinition",
      id: "Extension", name: "Extension",
      kind: "complex-type", type: "Extension",
      snapshot: {
        element: [
          {id: "Extension", path: "Extension"},
          {id: "Extension.extension", path: "Extension.extension", min: 0, max: "*", type: [{code: "Extension"}]},
          {id: "Extension.url", path: "Extension.url", min: 1, max: "1", type: [{code: "code"}]}
        ]
      }
    })

    const sd = buildDefinition({
      id: "CircularResource", name: "CircularResource", kind: "resource",
      snapshot: {
        element: [
          {id: "CircularResource", path: "CircularResource"},
          element("CircularResource.extension", "Extension", 0, "*")
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)

    expect(result.CircularResource).toBeDefined()
    expect(result.Extension).toBeDefined()

    // self-referencing field should use $ref
    const extSchema = result.Extension as Record<string, any>
    expect(extSchema.properties.extension.items).toEqual({"$ref": "#/definitions/Extension"})

    // no circular object references
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it("expands choice types into concrete property names", () => {
    writeDefinition("CodeableConcept", {
      resourceType: "StructureDefinition",
      id: "CodeableConcept", name: "CodeableConcept",
      kind: "complex-type", type: "CodeableConcept",
      snapshot: {element: [{id: "CodeableConcept", path: "CodeableConcept"}]}
    })

    writeDefinition("Reference", {
      resourceType: "StructureDefinition",
      id: "Reference", name: "Reference",
      kind: "complex-type", type: "Reference",
      snapshot: {element: [{id: "Reference", path: "Reference"}]}
    })

    const sd = buildDefinition({
      id: "ChoiceResource", name: "ChoiceResource", kind: "resource",
      snapshot: {
        element: [
          {id: "ChoiceResource", path: "ChoiceResource"},
          {
            id: "ChoiceResource.medication[x]",
            path: "ChoiceResource.medication[x]",
            min: 1, max: "1",
            type: [{code: "CodeableConcept"}, {code: "Reference"}]
          }
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const props = (result.ChoiceResource as Record<string, any>).properties

    expect(props.medicationCodeableConcept).toBeDefined()
    expect(props.medicationReference).toBeDefined()
    expect(props["medication[x]"]).toBeUndefined()
  })

  it("does not add choice type fields to required", () => {
    const sd = buildDefinition({
      id: "ChoiceReqResource", name: "ChoiceReqResource", kind: "resource",
      snapshot: {
        element: [
          {id: "ChoiceReqResource", path: "ChoiceReqResource"},
          {
            id: "ChoiceReqResource.value[x]",
            path: "ChoiceReqResource.value[x]",
            min: 1, max: "1",
            type: [{code: "code"}, {code: "code"}]
          }
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)

    // choice types with min>0 should not add [x] name to required
    expect((result.ChoiceReqResource as Record<string, any>).required).toBeUndefined()
  })

  it("applies cardinality to expanded choice type fields", () => {
    const sd = buildDefinition({
      id: "ChoiceArrayResource", name: "ChoiceArrayResource", kind: "resource",
      snapshot: {
        element: [
          {id: "ChoiceArrayResource", path: "ChoiceArrayResource"},
          {
            id: "ChoiceArrayResource.value[x]",
            path: "ChoiceArrayResource.value[x]",
            min: 0, max: "*",
            type: [{code: "code"}]
          }
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const props = (result.ChoiceArrayResource as Record<string, any>).properties

    expect(props.valueCode).toEqual({
      type: "array",
      items: {type: "boolean", pattern: undefined},
      minItems: 0
    })
  })
})

describe("applyCardinality", () => {
  const base = {type: "string" as const}

  function el(min: number | undefined, max: string): any {
    return {path: "", short: "", definition: "", comment: "", min, max, type: [], mapping: []}
  }

  it("returns schema unchanged when max is '1'", () => {
    expect(applyCardinality(base, el(0, "1"))).toBe(base)
  })

  it("returns schema unchanged when max is '0'", () => {
    expect(applyCardinality(base, el(0, "0"))).toBe(base)
  })

  it("wraps in array with minItems when max is '*'", () => {
    expect(applyCardinality(base, el(0, "*"))).toEqual({
      type: "array", items: base, minItems: 0
    })
  })

  it("wraps in array with minItems and maxItems when max > 1", () => {
    expect(applyCardinality(base, el(1, "5"))).toEqual({
      type: "array", items: base, minItems: 1, maxItems: 5
    })
  })

  it("defaults minItems to 0 when min is undefined", () => {
    expect(applyCardinality(base, el(undefined, "*"))).toEqual({
      type: "array", items: base, minItems: 0
    })
  })

  it("wraps in array when max is exactly '2'", () => {
    expect(applyCardinality(base, el(2, "2"))).toEqual({
      type: "array", items: base, minItems: 2, maxItems: 2
    })
  })
})
