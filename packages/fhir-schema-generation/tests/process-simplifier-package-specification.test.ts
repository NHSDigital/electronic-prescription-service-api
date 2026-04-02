import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import {
  beforeAll,
  describe,
  expect,
  it
} from "vitest"

import {processSimplifierPackageFile} from "../src/utils/process-simplifier-package-specification.js"
import {JSONSchema} from "json-schema-to-ts"

let sharedTmpDir: string

beforeAll(() => {
  // Use a single shared temp directory for these tests to easily resolve cross-file dependencies
  sharedTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fhir-schema-test-"))
})

describe("process-simplifier-package-specification utilities", () => {
  it("processes primitive-type structure definition", () => {
    // We use a shared prefix "Base" across all tests so `rootDir` evaluates identically
    // regardless of the order Vitest runs the tests in.
    const filePath = path.join(sharedTmpDir, "Base-Primitive.json")
    const schema = {
      resourceType: "StructureDefinition",
      id: "MyPrimitive",
      meta: {lastUpdated: "2024-01-01"},
      extension: [],
      url: "http://example.org/fhir/StructureDefinition/MyPrimitive",
      version: "1.0.0",
      name: "MyPrimitive",
      status: "active",
      date: "2024-01-01",
      publisher: "Test",
      contact: "",
      description: "Test primitive type",
      fhirVersion: "4.0.1",
      mapping: "",
      kind: "primitive-type",
      abstract: "false",
      type: "string",
      baseDefinition: "",
      derivation: "specialization",
      snapshot: {
        element: [
          {
            path: "MyPrimitive",
            short: "",
            definition: "",
            comment: "",
            min: 0,
            max: "1",
            type: [
              {
                code: "string",
                extension: [{url: "http://example.org/fhir/StructureDefinition/pattern", valueString: "^[a-z]+$"}]
              }
            ],
            mapping: [],
            id: "MyPrimitive"
          }
        ]
      },
      differential: {element: []}
    }
    fs.writeFileSync(filePath, JSON.stringify(schema), "utf-8")

    const existingSpecifications = new Map<string, JSONSchema>()
    processSimplifierPackageFile(filePath, existingSpecifications)

    expect(existingSpecifications.has("MyPrimitive")).toBe(true)
    expect(existingSpecifications.get("MyPrimitive")).toEqual({type: "string", pattern: "^[a-z]+$"})
  })

  it("processes resource structure definition properly", () => {
    const filePath = path.join(sharedTmpDir, "Base-Resource.json")
    const schema = {
      resourceType: "StructureDefinition",
      id: "MyResource",
      name: "MyResource",
      kind: "resource",
      snapshot: {
        element: [
          {id: "MyResource", path: "MyResource"},
          {
            id: "MyResource.status",
            path: "MyResource.status",
            min: 1,
            max: "1",
            type: [{code: "code"}]
          }
        ]
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(schema), "utf-8")

    // The logic will recursively look for "code". Since the root prefix is "Base", it requests "Base-code.json".
    const codeSchema = {
      resourceType: "StructureDefinition",
      id: "code",
      name: "code",
      kind: "primitive-type",
      type: "boolean", // Simplified to 'boolean' to avoid needing deep pattern extension mocking
      snapshot: {element: []}
    }
    fs.writeFileSync(path.join(sharedTmpDir, "Base-code.json"), JSON.stringify(codeSchema), "utf-8")

    const existingSpecifications = new Map<string, any>()
    processSimplifierPackageFile(filePath, existingSpecifications)

    expect(existingSpecifications.has("MyResource")).toBe(true)
    expect(existingSpecifications.get("MyResource")).toEqual({
      title: "MyResource",
      type: "object",
      properties: {status: {type: "boolean", pattern: undefined}},
      required: ["status"]
    })
  })

  it("processes properties arrays when max is '*'", () => {
    const filePath = path.join(sharedTmpDir, "Base-ArrayResource.json")
    const schema = {
      resourceType: "StructureDefinition",
      id: "MyArrayResource",
      name: "MyArrayResource",
      kind: "resource",
      snapshot: {
        element: [
          {id: "MyArrayResource", path: "MyArrayResource"},
          {
            id: "MyArrayResource.identifier",
            path: "MyArrayResource.identifier",
            min: 0,
            max: "*",
            type: [{code: "Identifier"}]
          }
        ]
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(schema), "utf-8")

    // Provide the child dependency "Identifier"
    const identifierSchema = {
      resourceType: "StructureDefinition",
      id: "Identifier",
      name: "Identifier",
      kind: "primitive-type",
      type: "boolean",
      snapshot: {element: []}
    }
    fs.writeFileSync(path.join(sharedTmpDir, "Base-Identifier.json"), JSON.stringify(identifierSchema), "utf-8")

    const existingSpecifications = new Map<string, any>()
    processSimplifierPackageFile(filePath, existingSpecifications)

    const resultingResource = existingSpecifications.get("MyArrayResource")
    expect(resultingResource.properties.identifier).toEqual({
      type: "array",
      items: {type: "boolean", pattern: undefined}
    })
  })

  it("returns early if element id is empty or matches root element name", () => {
    const filePath = path.join(sharedTmpDir, "Base-EmptyId.json")
    const schema = {
      resourceType: "StructureDefinition",
      id: "Empty",
      name: "", // Set name to empty string to trigger `id === simplifierSchema.name`
      kind: "resource",
      snapshot: {
        element: [
          {id: "", path: ""}
        ]
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(schema), "utf-8")

    const existingSpecifications = new Map<string, any>()
    processSimplifierPackageFile(filePath, existingSpecifications)

    // Ensure it was parsed but no sub-properties were resolved due to the early return
    expect(existingSpecifications.get("Empty").properties).toEqual({})
  })

  it("uses existing specification if the element id is already cached", () => {
    const filePath = path.join(sharedTmpDir, "Base-CachedResource.json")
    const schema = {
      resourceType: "StructureDefinition",
      id: "MyCachedResource",
      name: "MyCachedResource",
      kind: "resource",
      snapshot: {
        element: [
          {id: "MyCachedResource", path: "MyCachedResource"},
          {
            id: "MyCachedResource.status",
            path: "MyCachedResource.status",
            min: 1,
            type: [{code: "code"}]
          }
        ]
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(schema), "utf-8")

    const existingSpecifications = new Map<string, any>()

    // Pre-populate the map with the exact element.id to trigger the cache hit
    existingSpecifications.set(
      "MyCachedResource.status",
      {type: "string", description: "Successfully retrieved from cache"}
    )

    processSimplifierPackageFile(filePath, existingSpecifications)

    const resultingResource = existingSpecifications.get("MyCachedResource")
    expect(resultingResource.properties.status)
      .toEqual({type: "string", description: "Successfully retrieved from cache"})
  })

  it("returns undefined for unsupported schema kinds like 'logical'", () => {
    const filePath = path.join(sharedTmpDir, "Base-Logical.json")
    const schema = {
      resourceType: "StructureDefinition",
      id: "MyLogical",
      name: "MyLogical",
      kind: "logical",
      snapshot: {element: []}
    }
    fs.writeFileSync(filePath, JSON.stringify(schema), "utf-8")

    const existingSpecifications = new Map<string, any>()
    processSimplifierPackageFile(filePath, existingSpecifications)

    // Process runs gracefully but does not populate the map for 'MyLogical'
    // because `kind: "logical"` hits the `default:` switch case returning undefined.
    expect(existingSpecifications.has("MyLogical")).toBe(false)
  })
})
