import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import {describe, expect, it} from "vitest"

import {getSimplifierDefinitionFiles, parseSimplifierPackage} from "../src/utils/parse-simplifier-package.js"

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "fhir-schema-test-"))
}

describe("parse-simplifier-package utilities", () => {
  describe("parseSimplifierPackage", () => {
    it("parses JSON schema content from file", () => {
      const tmp = makeTempDir()
      const filePath = path.join(tmp, "test.schema.json")
      const payload = {foo: "bar", value: 42}
      fs.writeFileSync(filePath, JSON.stringify(payload), "utf-8")

      const parsed = parseSimplifierPackage(filePath)
      expect(parsed).toEqual(payload)
    })
  })

  describe("getSimplifierDefinitionFiles", () => {
    it("finds files with prefix in directory", async () => {
      const tmp = makeTempDir()
      fs.writeFileSync(path.join(tmp, "prefix-1.json"), "{}")
      fs.writeFileSync(path.join(tmp, "prefix-2.json"), "{}")
      fs.writeFileSync(path.join(tmp, "other.json"), "{}")

      const found = await getSimplifierDefinitionFiles(tmp, "prefix")

      expect(found).toContain(path.join(tmp, "prefix-1.json"))
      expect(found).toContain(path.join(tmp, "prefix-2.json"))
      expect(found).not.toContain(path.join(tmp, "other.json"))
    })

    it("throws an error when the directory cannot be read", async () => {
      const invalidPath = path.join(os.tmpdir(), "non-existent-directory-123456789")

      await expect(getSimplifierDefinitionFiles(invalidPath, "prefix"))
        .rejects.toThrow()
    })
  })
})
