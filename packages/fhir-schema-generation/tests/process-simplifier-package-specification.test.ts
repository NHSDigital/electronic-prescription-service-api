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

    // Use mockImplementation to handle recursive lookups for nested types like 'string'
    vi.mocked(parser.parseSimplifierPackage).mockImplementation((filePath: string) => {
      // Return the main resource mock
      if (filePath.includes("Patient.json")) {
        return mockResource as any
      }

      // Return a generic fallback for nested/referenced types so parsedSchema isn't undefined
      return {
        id: "string",
        kind: "primitive-type",
        type: "string",
        differential: {element: []}
      } as any
    })

    processor.processSpecification("Patient.json")
    const patientSpec: any = processor.getSpecifications().get("Patient")

    // In SchemaProcessor, required properties are wrapped in definitions.[ResourceName].allOf[1]
    expect(patientSpec.definitions.Patient.allOf[1].required).toContain("name")
  })

  it("throws an error for unrecognized specification kinds", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fhir-schema-"))
    const filePath = path.join(tmpDir, "Invalid.json")

    const mockResource ={
      resourceType: "StructureDefinition",
      id: "Invalid",
      kind: "unknown-type", // Triggers the default switch case
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
          // A 3-part ID triggers the idParts.length > 1 condition
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

    // Verify lines 117-118 triggered: "Patient.contact" became "Patient_Contact"
    expect(patientSpec.definitions).toHaveProperty("Patient_Contact")

    // Verify that the final property "name" was properly assigned to the nested sub-definition
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
            short: "active | on-hold | cancelled | completed", // Triggers lines 180-182
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

    // Navigate to the 'status' property within the MedicationRequest definition
    const statusProp = specs.definitions.MedicationRequest.allOf[1].properties.status

    // Assertions for lines 180-182
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
            type: [{code: "Reference"}] // 'Reference' is a complex type
          }
        ]
      }
    }

    vi.mocked(parser.parseSimplifierPackage).mockImplementation((filePath: string) => {
      if (filePath.includes("MedicationRequest.json")) {
        return mockResource as any
      }
      // Return a mock for the dependency 'Reference'
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

    // Assertions for lines 191-192
    expect(subjectProp).toEqual({
      "$ref": "Reference.schema.json#/$definitions/Reference",
      description: "Who the medication is for"
    })
  })
})
