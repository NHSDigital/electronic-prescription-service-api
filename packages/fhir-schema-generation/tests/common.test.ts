import {describe, expect, it} from "vitest"
import {normalizeFileName} from "../src/utils/common.js"

describe("common utilities", () => {
  describe("normalizeFileName", () => {
    it("should replace all slashes with dashes", () => {
      const input = "hl7.fhir.r4.core/package/file.json"
      const expected = "hl7.fhir.r4.core-package-file.json"
      expect(normalizeFileName(input)).toBe(expected)
    })

    it("should return the original string if no slashes are present", () => {
      const input = "simple-filename.json"
      expect(normalizeFileName(input)).toBe(input)
    })

    it("should handle empty strings", () => {
      expect(normalizeFileName("")).toBe("")
    })
  })
})
