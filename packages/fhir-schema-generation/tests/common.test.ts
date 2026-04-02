import {describe, expect, it} from "vitest"
import {normalizeFileName} from "../src/utils/common.js"

describe("common utilities", () => {
  describe("normalizeFileName", () => {
    it("should replace all slashes with dashes in a file name", () => {
      const input = "hl7.fhir.r4.core/package/some/nested/file.json"
      const expected = "hl7.fhir.r4.core-package-some-nested-file.json"

      const result = normalizeFileName(input)

      expect(result).toBe(expected)
    })

    it("should return the original string if no slashes are present", () => {
      const input = "hl7.fhir.r4.core-package"

      const result = normalizeFileName(input)

      expect(result).toBe(input)
    })
  })
})
