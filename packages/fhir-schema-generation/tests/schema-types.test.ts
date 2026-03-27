import {describe, it, expect} from "vitest"
import {
  isSchemaReference,
  isSchemaBody,
  isPropertyReference,
  isPropertyArray,
  isPropertyBool,
  isPropertyNumber,
  isPropertyEnum,
  isPropertyPattern
} from "../src/utils/schema-types.js"

describe("schema-types type guards", () => {
  describe("isSchemaReference", () => {
    it("should return true for an object with $ref", () => {
      expect(isSchemaReference({$ref: "#/definitions/Foo"})).toBe(true)
    })

    it("should return false for an object without $ref", () => {
      expect(isSchemaReference({description: "hello"})).toBe(false)
    })

    it("should return false for null", () => {
      expect(isSchemaReference(null)).toBe(false)
    })
  })

  describe("isSchemaBody", () => {
    it("should return true for an object with properties and description", () => {
      expect(isSchemaBody({
        properties: {field: {type: "string"}},
        description: "A body node"
      })).toBe(true)
    })

    it("should return false when missing description", () => {
      expect(isSchemaBody({properties: {}})).toBe(false)
    })

    it("should return false when missing properties", () => {
      expect(isSchemaBody({description: "no properties"})).toBe(false)
    })
  })

  describe("isPropertyReference", () => {
    it("should return true for an object with $ref", () => {
      expect(isPropertyReference({$ref: "#/definitions/SomeType"})).toBe(true)
    })

    it("should return false for an object without $ref", () => {
      expect(isPropertyReference({type: "string"})).toBe(false)
    })
  })

  describe("isPropertyArray", () => {
    it("should return true for a property with type array and items", () => {
      expect(isPropertyArray({
        type: "array",
        items: {type: "string"},
        description: "An array property"
      })).toBe(true)
    })

    it("should return false when type is not array", () => {
      expect(isPropertyArray({
        type: "string",
        items: {},
        description: "Not an array"
      })).toBe(false)
    })

    it("should return false when items is missing", () => {
      expect(isPropertyArray({type: "array", description: "No items"})).toBe(false)
    })

    it("should return false for non-object", () => {
      expect(isPropertyArray(42)).toBe(false)
    })
  })

  describe("isPropertyBool", () => {
    it("should return true for {type: 'boolean'}", () => {
      expect(isPropertyBool({type: "boolean", description: "A boolean"})).toBe(true)
    })

    it("should return false for {type: 'string'}", () => {
      expect(isPropertyBool({type: "string", description: "Not bool"})).toBe(false)
    })
  })

  describe("isPropertyNumber", () => {
    it("should return true for {type: 'number', pattern: '...'}", () => {
      expect(isPropertyNumber({
        type: "number",
        pattern: "^[0-9]+$",
        description: "A number"
      })).toBe(true)
    })

    it("should return false when pattern is missing", () => {
      expect(isPropertyNumber({type: "number", description: "No pattern"})).toBe(false)
    })

    it("should return false for non-number type", () => {
      expect(isPropertyNumber({type: "string", pattern: "x", description: "x"})).toBe(false)
    })
  })

  describe("isPropertyEnum", () => {
    it("should return true for {type: 'string', enum: [...]}", () => {
      expect(isPropertyEnum({
        type: "string",
        enum: ["a", "b"],
        description: "An enum"
      })).toBe(true)
    })

    it("should return false when enum is missing", () => {
      expect(isPropertyEnum({type: "string", description: "No enum"})).toBe(false)
    })

    it("should return false for non-string type", () => {
      expect(isPropertyEnum({type: "number", enum: ["a"], description: "x"})).toBe(false)
    })
  })

  describe("isPropertyPattern", () => {
    it("should return true for {type: 'string', pattern: '...'}", () => {
      expect(isPropertyPattern({
        type: "string",
        pattern: "^[a-z]+$",
        description: "A pattern"
      })).toBe(true)
    })

    it("should return false when pattern is missing", () => {
      expect(isPropertyPattern({type: "string", description: "No pattern"})).toBe(false)
    })

    it("should return false when enum is also present", () => {
      expect(isPropertyPattern({
        type: "string",
        pattern: "^x$",
        enum: ["x"],
        description: "Has both"
      })).toBe(false)
    })

    it("should return false for non-string type", () => {
      expect(isPropertyPattern({type: "number", pattern: "x", description: "x"})).toBe(false)
    })
  })
})
