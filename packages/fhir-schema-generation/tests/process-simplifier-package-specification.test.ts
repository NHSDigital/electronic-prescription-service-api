import * as fs from "node:fs"
import * as path from "node:path"
import * as os from "node:os"
import * as parser from "../src/utils/parse-simplifier-package.js"
import {
  describe,
  expect,
  it,
  vi,
  beforeEach
} from "vitest"
import {SchemaProcessor} from "../src/utils/process-simplifier-package-specification.js"

vi.mock("../src/utils/parse-simplifier-package.js")

describe("SchemaProcessor", () => {
  let processor: SchemaProcessor

  beforeEach(() => {
    processor = new SchemaProcessor()
    vi.clearAllMocks()
  })

  it("converts FHIR primitive-type to JSON Schema pattern", () => {
    const mockSchema = {
      id: "string",
      kind: "primitive-type",
      type: "string",
      differential: {
        element: [{
          type: [{
            extension: [{valueString: "^[a-z]$"}]
          }]
        }]
      }
    }
    vi.mocked(parser.parseSimplifierPackage).mockReturnValue(mockSchema as any)

    processor.processSimplifierPackageSpecifications(["string.json"])

    // Access the private primitives map as suggested
    const primitives = (processor as any).primitives
    expect(primitives.get("string")).toEqual({
      type: "string",
      pattern: "^[a-z]$"
    })
  })

  it("handles non-string primitives without adding a regex pattern", () => {
    const mockSchema = {
      id: "boolean",
      kind: "primitive-type",
      type: "boolean",
      differential: {element: []}
    }
    vi.mocked(parser.parseSimplifierPackage).mockReturnValue(mockSchema as any)

    processor.processSimplifierPackageSpecifications(["boolean.json"])

    const primitives = (processor as any).primitives
    expect(primitives.get("boolean")).toEqual({
      type: "boolean" // Should not extract or assign a pattern
    })
  })

  it("handles required fields based on 'min' property", () => {
    const mockResource = {
      id: "Patient",
      name: "Patient",
      kind: "resource",
      differential: {
        element: [
          {id: "Patient", path: "Patient"},
          {id: "Patient.name", min: 1, type: [{code: "string"}]}
        ]
      }
    }

    vi.mocked(parser.parseSimplifierPackage).mockImplementation((filePath: string) => {
      if (filePath.includes("Patient.json")) {
        return mockResource as any
      }
      return {
        id: "string",
        kind: "primitive-type",
        type: "string",
        differential: {element: []}
      } as any
    })

    processor.processSpecification("Patient.json")
    const patientSpec: any = processor.getSpecifications().get("Patient")

    expect(patientSpec.definitions.Patient.allOf[1].required).toContain("name")
  })

  it("throws an error for unrecognized specification kinds", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fhir-schema-"))
    const filePath = path.join(tmpDir, "Invalid.json")

    const mockResource ={
      resourceType: "StructureDefinition",
      id: "Invalid",
      kind: "unknown-type",
      differential: {element: []}
    }

    vi.mocked(parser.parseSimplifierPackage)
      .mockReturnValueOnce(mockResource as any)

    const processor = new SchemaProcessor()
    expect(() => processor.processSimplifierPackageSpecifications([filePath]))
      .toThrow("Unrecognised specification type: unknown-type")
  })

  it("creates capitalized sub-definitions for nested elements", () => {
    const mockResource = {
      id: "Patient",
      name: "Patient",
      kind: "resource",
      differential: {
        element: [
          {id: "Patient", path: "Patient"},
          {id: "Patient.contact.name", type: [{code: "string"}], min: 1}
        ]
      }
    }

    vi.mocked(parser.parseSimplifierPackage).mockImplementation((filePath: string) => {
      if (filePath.includes("Patient.json")) {
        return mockResource as any
      }
      return {
        id: "string",
        kind: "primitive-type",
        type: "string",
        differential: {element: []}
      } as any
    })

    processor.processSimplifierPackageSpecifications(["Patient.json"])
    const patientSpec: any = processor.getSpecifications().get("Patient")

    expect(patientSpec.definitions).toHaveProperty("Patient_Contact")

    const contactDef = patientSpec.definitions["Patient_Contact"]
    expect(contactDef.allOf[1].properties).toHaveProperty("name")
  })

  it("converts 'short' descriptions with pipe separators into JSON Schema enums", () => {
    const mockResource = {
      id: "MedicationRequest",
      name: "MedicationRequest",
      kind: "resource",
      differential: {
        element: [
          {id: "MedicationRequest", path: "MedicationRequest"},
          {
            id: "MedicationRequest.status",
            path: "MedicationRequest.status",
            short: "active | on-hold | cancelled | completed",
            definition: "A code specifying the current state of the order.",
            min: 1,
            type: [{code: "code"}]
          }
        ]
      }
    }

    vi.mocked(parser.parseSimplifierPackage).mockImplementation((filePath: string) => {
      if (filePath.includes("MedicationRequest.json")) {
        return mockResource as any
      }
      return {
        id: "code",
        kind: "primitive-type",
        type: "string",
        differential: {element: []}
      } as any
    })

    processor.processSimplifierPackageSpecifications(["MedicationRequest.json"])
    const specs: any = processor.getSpecifications().get("MedicationRequest")
    const statusProp = specs.definitions.MedicationRequest.allOf[1].properties.status

    expect(statusProp.type).toBe("string")
    expect(statusProp.enum).toEqual(["active", "on-hold", "cancelled", "completed"])
    expect(statusProp.description).toBe("A code specifying the current state of the order.")
  })

  it("creates a $ref for complex types that are not in progress", () => {
    const mockResource = {
      id: "MedicationRequest",
      name: "MedicationRequest",
      kind: "resource",
      differential: {
        element: [
          {id: "MedicationRequest", path: "MedicationRequest"},
          {
            id: "MedicationRequest.subject",
            path: "MedicationRequest.subject",
            definition: "Who the medication is for",
            min: 1,
            type: [{code: "Reference"}]
          }
        ]
      }
    }

    vi.mocked(parser.parseSimplifierPackage).mockImplementation((filePath: string) => {
      if (filePath.includes("MedicationRequest.json")) {
        return mockResource as any
      }
      return {
        id: "Reference",
        name: "Reference",
        kind: "complex-type",
        differential: {element: []}
      } as any
    })

    processor.processSimplifierPackageSpecifications(["MedicationRequest.json"])

    const specs: any = processor.getSpecifications().get("MedicationRequest")
    const subjectProp = specs.definitions.MedicationRequest.allOf[1].properties.subject

    expect(subjectProp).toEqual({
      "$ref": "Reference.schema.json#/$definitions/Reference",
      description: "Who the medication is for"
    })
  })

  it("returns early and safely handles an empty filename list or undefined items", () => {
    expect(() => processor.processSimplifierPackageSpecifications([])).not.toThrow()
    expect(() => processor.processSimplifierPackageSpecifications([undefined as any])).not.toThrow()
    expect(processor.getSpecifications().size).toBe(0)
  })

  it("skips elements without a type and safely returns early on duplicate initialization", () => {
    const mockResource = {
      id: "Patient",
      name: "Patient",
      kind: "resource",
      differential: {
        element: [
          {id: "Patient", path: "Patient"},
          {id: "Patient.notype", path: "Patient.notype", min: 1},
          {id: "Patient.name", path: "Patient.name", type: [{code: "string"}], min: 1},
          {id: "Patient.name", path: "Patient.name", type: [{code: "string"}], min: 1}
        ]
      }
    }

    // FIX: Replaced mockReturnValue with mockImplementation to break the infinite recursion cycle
    vi.mocked(parser.parseSimplifierPackage).mockImplementation((filePath: string) => {
      if (filePath.includes("Patient.json")) return mockResource as any
      return {id: "string", kind: "primitive-type", type: "string", differential: {element: []}} as any
    })

    processor.processSimplifierPackageSpecifications(["Patient.json"])
    const spec: any = processor.getSpecifications().get("Patient")
    const props = spec.definitions.Patient.allOf[1].properties

    expect(props.notype).toBeUndefined()
    expect(props.name).toBeDefined()
  })

  it("retains extensions of required properties and filters deep references properly", () => {
    const mockResource = {
      id: "TestResource",
      name: "TestResource",
      kind: "resource",
      differential: {
        element: [
          {id: "TestResource", path: "TestResource"},
          {id: "TestResource.name", path: "TestResource.name", min: 1, type: [{code: "string"}]}, // required primitive
          {
            id: "TestResource._name",
            path: "TestResource._name",
            type: [{code: "Element"}]
          }, // extension of required field
          {
            id: "TestResource.optional",
            path: "TestResource.optional",
            min: 0,
            type: [{code: "string"}]
          }, // optional primitive
          {id: "TestResource.nested", path: "TestResource.nested", min: 0, type: [{code: "NestedObject"}]} // nested ref
        ]
      }
    }

    const nestedMock = {
      id: "NestedObject",
      name: "NestedObject",
      kind: "complex-type",
      differential: {
        element: [
          {id: "NestedObject", path: "NestedObject"},
          {id: "NestedObject.reqField", path: "NestedObject.reqField", min: 1, type: [{code: "string"}]}
        ]
      }
    }

    vi.mocked(parser.parseSimplifierPackage).mockImplementation((filePath: string) => {
      if (filePath.includes("TestResource.json")) return mockResource as any
      if (filePath.includes("NestedObject.json")) return nestedMock as any

      // Dynamically extract the expected ID from the filename to prevent infinite loops
      const fileNameMatch = filePath.match(/([a-zA-Z0-9_-]+)\.json$/)
      const mockId = fileNameMatch ? fileNameMatch[1] : "string"

      return {
        id: mockId,
        kind: "primitive-type",
        type: "string",
        differential: {element: []}
      } as any
    })

    processor.processSimplifierPackageSpecifications(["TestResource.json"])
    const spec: any = processor.getSpecifications().get("TestResource")
    const props = spec.definitions.TestResource.allOf[1].properties

    expect(props.name).toBeDefined()
    expect(props._name).toBeDefined() // Extension of required kept
    expect(props.optional).toBeUndefined() // Optional stripped
    expect(props.nested).toBeDefined() // Retained due to deep required properties
  })
})
