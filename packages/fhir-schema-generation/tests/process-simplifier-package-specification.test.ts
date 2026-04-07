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

    processor.processSimplifierPackageSpecifications("string.json")
    const specs = processor.getSpecifications()

    expect(specs.get("string")).toEqual({
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
    // Mock the recursive call for 'string'
    vi.mocked(parser.parseSimplifierPackage)
      .mockReturnValueOnce(mockResource as any)

    processor.processSimplifierPackageSpecifications("Patient.json")
    const patientSpec: any = processor.getSpecifications().get("Patient")

    expect(patientSpec.required).toContain("name")
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
    expect(() => processor.processSimplifierPackageSpecifications(filePath))
      .toThrow("Unrecognised specification type: unknown-type")
  })
})
