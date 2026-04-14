import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import {
  beforeAll,
  describe,
  expect,
  it
} from "vitest"

import {parseFhirSchema} from "../src/utils/parse-fhir-schema.js"

let tmpDir: string

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "parse-fhir-schema-test-"))

  const packageDir = path.join(tmpDir, "package")
  fs.mkdirSync(packageDir, {recursive: true})

  fs.writeFileSync(
    path.join(packageDir, "StructureDefinition-TestResource.json"),
    JSON.stringify({
      resourceType: "StructureDefinition",
      id: "TestResource",
      name: "TestResource",
      kind: "resource",
      type: "TestResource",
      snapshot: {element: []},
      differential: {element: []}
    }),
    "utf-8"
  )
})

describe("parseFhirSchema", () => {
  it("parses a structure definition from the package directory", () => {
    const result = parseFhirSchema(tmpDir, "StructureDefinition-TestResource.json")

    expect(result.id).toBe("TestResource")
    expect(result.kind).toBe("resource")
    expect(result.name).toBe("TestResource")
  })

  it("throws when the file does not exist", () => {
    expect(() => parseFhirSchema(tmpDir, "NonExistent.json")).toThrow()
  })
})
