import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import {
  beforeAll,
  describe,
  expect,
  it
} from "vitest"

import {
  generateSchema,
  applyCardinality,
  hasBindingEnum,
  buildBindingEnum
} from "../src/utils/generate-openapi-schema.js"
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

function element(
  id: string, code: string, min: number, max: string,
  extras: Record<string, unknown> = {}
): Record<string, unknown> {
  return {id, path: id, min, max, type: [{code}], ...extras}
}

// helper to access the allOf body (properties/required) for a definition key
function getDefBody(result: Record<string, any>, schemaId: string, defKey: string): any {
  return result[schemaId]?.definitions?.[defKey]?.allOf?.[1]
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
          id: "MyPrimitive",
          path: "MyPrimitive",
          short: "",
          definition: "",
          comment: "",
          min: 1,
          max: "1",
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

  it("wraps resource output in schema envelope with $schema, $id, $ref, definitions", () => {
    const sd = buildDefinition({
      id: "Envelope", name: "Envelope", kind: "resource",
      differential: {
        element: [
          element("Envelope.status", "code", 1, "1", {definition: "The status"})
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const schema = result.Envelope as Record<string, any>

    expect(schema.$schema).toBe("http://json-schema.org/draft-04/schema#")
    expect(schema.$id).toBe("http://hl7.org/fhir/json-schema/Envelope")
    expect(schema.$ref).toBe("#/definitions/Envelope")
    expect(schema.description).toBe(
      "see http://hl7.org/fhir/json.html#schema for information about the FHIR Json Schemas"
    )
    expect(schema.definitions).toBeDefined()
    expect(schema.definitions.Envelope).toBeDefined()
  })

  it("uses differential.element instead of snapshot.element", () => {
    const sd = buildDefinition({
      id: "DiffResource", name: "DiffResource", kind: "resource",
      snapshot: {
        element: [
          {id: "DiffResource.snapshotOnly", path: "DiffResource.snapshotOnly",
            min: 0, max: "1", type: [{code: "code"}], definition: "from snapshot"}
        ]
      } as any,
      differential: {
        element: [
          element("DiffResource.diffOnly", "code", 0, "1", {definition: "from differential"})
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const body = getDefBody(result, "DiffResource", "DiffResource")

    expect(body.properties.diffOnly).toBeDefined()
    expect(body.properties.snapshotOnly).toBeUndefined()
  })

  it("resolves primitive dependencies and inlines them with description", () => {
    const sd = buildDefinition({
      id: "MyResource", name: "MyResource", kind: "resource",
      differential: {
        element: [
          element("MyResource.status", "code", 1, "1", {definition: "The status"})
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const body = getDefBody(result, "MyResource", "MyResource")

    expect(body.properties.status).toEqual({
      description: "The status",
      type: "boolean",
      pattern: undefined
    })
    expect(body.required).toContain("status")
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
      differential: {
        element: [
          element("ArrayResource.identifier", "Identifier", 0, "*", {definition: "ids"})
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const body = getDefBody(result, "ArrayResource", "ArrayResource")

    expect(body.properties.identifier).toEqual({
      type: "array",
      items: {description: "ids", type: "boolean", pattern: undefined}
    })
  })

  it("wraps bounded array fields with minItems and maxItems", () => {
    const sd = buildDefinition({
      id: "BoundedResource", name: "BoundedResource", kind: "resource",
      differential: {
        element: [
          element("BoundedResource.telecom", "code", 1, "3", {definition: "contact"})
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const body = getDefBody(result, "BoundedResource", "BoundedResource")

    expect(body.properties.telecom).toEqual({
      type: "array",
      items: {description: "contact", type: "boolean", pattern: undefined},
      minItems: 1,
      maxItems: 3
    })
    expect(body.required).toContain("telecom")
  })

  it("does not wrap singular fields in an array", () => {
    const sd = buildDefinition({
      id: "SingleResource", name: "SingleResource", kind: "resource",
      differential: {
        element: [
          element("SingleResource.status", "code", 0, "1", {definition: "status"})
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const body = getDefBody(result, "SingleResource", "SingleResource")

    expect(body.properties.status).toEqual({description: "status", type: "boolean", pattern: undefined})
    expect(body.required).toBeUndefined()
  })

  it("marks fields with min > 0 as required", () => {
    const sd = buildDefinition({
      id: "ReqResource", name: "ReqResource", kind: "resource",
      differential: {
        element: [
          element("ReqResource.name", "code", 1, "1"),
          element("ReqResource.description", "code", 0, "1")
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const body = getDefBody(result, "ReqResource", "ReqResource")

    expect(body.required).toEqual(["name"])
  })

  it("skips elements with no type and produces no definitions", () => {
    const sd = buildDefinition({
      id: "EmptyIdResource", name: "EmptyIdResource", kind: "resource",
      differential: {element: [{id: "EmptyIdResource.mystery", path: "EmptyIdResource.mystery"}]} as any
    })

    const result = generateSchema(sd, tmpDir)
    const schema = result.EmptyIdResource as Record<string, any>

    expect(schema.$ref).toBe("#/definitions/EmptyIdResource")
    expect(schema.definitions).toBeUndefined()
  })

  it("uses $ref with $definitions path for complex types", () => {
    writeDefinition("Reference", {
      resourceType: "StructureDefinition",
      id: "Reference", name: "Reference",
      kind: "complex-type", type: "Reference",
      differential: {element: []}
    })

    const sd = buildDefinition({
      id: "RefResource", name: "RefResource", kind: "resource",
      differential: {
        element: [
          element("RefResource.subject", "Reference", 1, "1", {definition: "Who"})
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const body = getDefBody(result, "RefResource", "RefResource")

    expect(body.properties.subject).toEqual({
      "$ref": "Reference.schema.json#/$definitions/Reference",
      description: "Who"
    })
  })

  it("converts pipe-separated short descriptions into enums", () => {
    const sd = buildDefinition({
      id: "EnumResource", name: "EnumResource", kind: "resource",
      differential: {
        element: [{
          id: "EnumResource.status", path: "EnumResource.status",
          short: "active | on-hold | cancelled",
          definition: "Current state",
          min: 1, max: "1",
          type: [{code: "code"}]
        }]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const body = getDefBody(result, "EnumResource", "EnumResource")

    expect(body.properties.status).toEqual({
      description: "Current state",
      enum: ["active", "on-hold", "cancelled"],
      type: "string"
    })
    expect(body.required).toContain("status")
  })

  it("creates sub-definitions for nested element paths", () => {
    const sd = buildDefinition({
      id: "Patient", name: "Patient", kind: "resource",
      differential: {
        element: [
          element("Patient.name", "code", 1, "1"),
          {
            id: "Patient.contact.name",
            path: "Patient.contact.name",
            min: 1,
            max: "1",
            definition: "Contact name",
            type: [{code: "code"}]
          }
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const schema = result.Patient as Record<string, any>

    expect(schema.definitions.Patient_Contact).toBeDefined()
    const contactBody = getDefBody(result, "Patient", "Patient_Contact")
    expect(contactBody.properties).toHaveProperty("name")
  })

  it("derives sub-definition base ref from first alphabetical element type", () => {
    const sd = buildDefinition({
      id: "SubRefResource", name: "SubRefResource", kind: "resource",
      differential: {
        element: [
          element("SubRefResource.status", "code", 0, "1"),
          {id: "SubRefResource.dispenseRequest.quantity", path: "SubRefResource.dispenseRequest.quantity",
            min: 0, max: "1", definition: "Amount", type: [{code: "Quantity"}]}
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const dispReqDef = (result.SubRefResource as any).definitions.SubRefResource_DispenseRequest

    expect(dispReqDef.allOf[0]).toEqual({"$ref": "Quantity#/definitions/Quantity"})
  })

  it("wraps allOf with base class reference from baseDefinition", () => {
    const sd = buildDefinition({
      id: "Task", name: "Task", kind: "resource",
      baseDefinition: "http://hl7.org/fhir/StructureDefinition/DomainResource",
      differential: {
        element: [
          element("Task.status", "code", 1, "1", {definition: "Task status"})
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const taskDef = (result.Task as Record<string, any>).definitions.Task

    expect(taskDef.allOf[0]).toEqual({"$ref": "DomainResource#/definitions/DomainResource"})
  })

  it("handles circular references with $ref instead of infinite recursion", () => {
    writeDefinition("Extension", {
      resourceType: "StructureDefinition",
      id: "Extension", name: "Extension",
      kind: "complex-type", type: "Extension",
      differential: {
        element: [
          {id: "Extension.extension", path: "Extension.extension", min: 0, max: "*", type: [{code: "Extension"}]},
          {id: "Extension.url", path: "Extension.url", min: 1, max: "1", type: [{code: "code"}]}
        ]
      }
    })

    const sd = buildDefinition({
      id: "CircularResource", name: "CircularResource", kind: "resource",
      differential: {
        element: [
          element("CircularResource.extension", "Extension", 0, "*", {definition: "ext"})
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)

    expect(result.CircularResource).toBeDefined()
    expect(result.Extension).toBeDefined()

    // no circular object references
    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it("keeps choice types as [x] field name with first type", () => {
    writeDefinition("CodeableConcept", {
      resourceType: "StructureDefinition",
      id: "CodeableConcept", name: "CodeableConcept",
      kind: "complex-type", type: "CodeableConcept",
      differential: {element: []}
    })

    const sd = buildDefinition({
      id: "ChoiceResource", name: "ChoiceResource", kind: "resource",
      differential: {
        element: [{
          id: "ChoiceResource.medication[x]",
          path: "ChoiceResource.medication[x]",
          definition: "The medication",
          min: 1, max: "1",
          type: [{code: "CodeableConcept"}, {code: "Reference"}]
        }]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const body = getDefBody(result, "ChoiceResource", "ChoiceResource")

    // [x] name is preserved, not expanded
    expect(body.properties["medication"]).toBeDefined()
    expect(body.properties.medicationCodeableConcept).toBeUndefined()
    expect(body.properties.medicationReference).toBeUndefined()

    // uses first type for $ref
    expect(body.properties["medication"]).toEqual({
      "$ref": "CodeableConcept.schema.json#/$definitions/CodeableConcept",
      description: "The medication"
    })
  })

  it("adds choice type [x] fields to required when min > 0", () => {
    const sd = buildDefinition({
      id: "ChoiceReqResource", name: "ChoiceReqResource", kind: "resource",
      differential: {
        element: [{
          id: "ChoiceReqResource.value[x]",
          path: "ChoiceReqResource.value[x]",
          min: 1, max: "1",
          type: [{code: "code"}]
        }]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const body = getDefBody(result, "ChoiceReqResource", "ChoiceReqResource")

    expect(body.required).toContain("value")
  })

  it("applies cardinality to choice type fields", () => {
    const sd = buildDefinition({
      id: "ChoiceArrayResource", name: "ChoiceArrayResource", kind: "resource",
      differential: {
        element: [{
          id: "ChoiceArrayResource.value[x]",
          path: "ChoiceArrayResource.value[x]",
          min: 0, max: "*",
          type: [{code: "code"}]
        }]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const body = getDefBody(result, "ChoiceArrayResource", "ChoiceArrayResource")

    expect(body.properties["value"]).toEqual({
      type: "array",
      items: {type: "boolean", pattern: undefined}
    })
  })

  it("applies cardinality to binding enums", () => {
    const sd = buildDefinition({
      id: "EnumArrayResource", name: "EnumArrayResource", kind: "resource",
      differential: {
        element: [{
          id: "EnumArrayResource.tags", path: "EnumArrayResource.tags",
          short: "a | b | c", definition: "Tags",
          min: 0, max: "*",
          type: [{code: "code"}]
        }]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const body = getDefBody(result, "EnumArrayResource", "EnumArrayResource")

    expect(body.properties.tags).toEqual({
      type: "array",
      items: {description: "Tags", enum: ["a", "b", "c"], type: "string"}
    })
  })

  it("handles deeply nested paths (4+ levels)", () => {
    writeDefinition("Duration", {
      resourceType: "StructureDefinition",
      id: "Duration", name: "Duration",
      kind: "complex-type", type: "Duration",
      differential: {element: []}
    })

    writeDefinition("BackboneElement", {
      resourceType: "StructureDefinition",
      id: "BackboneElement", name: "BackboneElement",
      kind: "complex-type", type: "BackboneElement",
      differential: {element: []}
    })

    const sd = buildDefinition({
      id: "Deep", name: "Deep", kind: "resource",
      differential: {
        element: [
          element("Deep.status", "code", 1, "1"),
          {id: "Deep.dispenseRequest.initialFill",
            path: "Deep.dispenseRequest.initialFill",
            min: 1,
            max: "1",
            definition: "First fill",
            type: [{code: "BackboneElement"}]},
          {id: "Deep.dispenseRequest.initialFill.duration",
            path: "Deep.dispenseRequest.initialFill.duration",
            min: 1,
            max: "1",
            definition: "How long",
            type: [{code: "Duration"}]}
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)

    const dispenseRequestBody = getDefBody(result, "Deep", "Deep_DispenseRequest")
    expect(dispenseRequestBody.properties.initialFill).toBeDefined()
    expect(dispenseRequestBody.properties.initialFill["$ref"]).toBe(
      "#/definitions/Deep_DispenseRequest_InitialFill"
    )

    const initialFillBody = getDefBody(result, "Deep", "Deep_DispenseRequest_InitialFill")
    expect(initialFillBody.properties.duration).toEqual({
      "$ref": "Duration.schema.json#/$definitions/Duration",
      description: "How long"
    })
  })

  it("sets allOf[1].description from first alphabetically-sorted element", () => {
    const sd = buildDefinition({
      id: "DescResource", name: "DescResource", kind: "resource",
      differential: {
        element: [
          element("DescResource.zebra", "code", 0, "1", {definition: "last alphabetically"}),
          element("DescResource.alpha", "code", 0, "1", {definition: "first alphabetically"})
        ]
      } as any
    })

    const result = generateSchema(sd, tmpDir)
    const body = getDefBody(result, "DescResource", "DescResource")

    // description comes from the first element processed after sorting
    expect(body.description).toBe("first alphabetically")
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

  it("wraps in array without minItems when min is 0 and max is '*'", () => {
    expect(applyCardinality(base, el(0, "*"))).toEqual({
      type: "array", items: base
    })
  })

  it("wraps in array with minItems and maxItems when max > 1", () => {
    expect(applyCardinality(base, el(1, "5"))).toEqual({
      type: "array", items: base, minItems: 1, maxItems: 5
    })
  })

  it("omits minItems when min is undefined (defaults to 0)", () => {
    expect(applyCardinality(base, el(undefined, "*"))).toEqual({
      type: "array", items: base
    })
  })

  it("wraps in array when max is exactly '2'", () => {
    expect(applyCardinality(base, el(2, "2"))).toEqual({
      type: "array", items: base, minItems: 2, maxItems: 2
    })
  })
})

describe("hasBindingEnum", () => {
  it("returns true for pipe-separated short descriptions", () => {
    const el: any = {short: "active | on-hold | cancelled"}
    expect(hasBindingEnum(el)).toBe(true)
  })

  it("returns false for plain short descriptions", () => {
    const el: any = {short: "A simple description"}
    expect(hasBindingEnum(el)).toBe(false)
  })

  it("returns false when short is undefined", () => {
    const el: any = {}
    expect(hasBindingEnum(el)).toBe(false)
  })
})

describe("buildBindingEnum", () => {
  it("creates an enum schema from pipe-separated values", () => {
    const el: any = {short: "a | b | c", definition: "Test enum"}

    expect(buildBindingEnum(el)).toEqual({
      description: "Test enum",
      enum: ["a", "b", "c"],
      type: "string"
    })
  })

  it("trims whitespace from enum values", () => {
    const el: any = {short: " draft |  active | completed ", definition: "Status"}

    const result = buildBindingEnum(el) as Record<string, any>
    expect(result.enum).toEqual(["draft", "active", "completed"])
  })
})
