import {describe, it, expect} from "vitest" // or "jest"
import {filterRequiredSchemas} from "../src/utils/filter-schema.js"
import {EditableJSONSchema} from "../src/types/editable-json-schema.type.js"

// Helper to quickly build a mock generated schema
function mockSchema(
  id: string,
  properties: Record<string, any> = {},
  required?: Array<string>
): EditableJSONSchema {
  const body: any = {properties}
  if (required && required.length > 0) {
    body.required = required
  }

  return {
    $id: id,
    definitions: {
      [id]: {
        allOf: [
          {$ref: "DomainResource"},
          body
        ]
      }
    } as any
  }
}

describe("filterRequiredSchemas", () => {
  it("keeps a schema that has a direct required property", () => {
    const schemas: Record<string, EditableJSONSchema> = {
      Patient: mockSchema("Patient", {name: {type: "string"}}, ["name"])
    }

    const result = filterRequiredSchemas(schemas)

    expect(result.Patient).toBeDefined()
    // It should also clean up unrequired properties (though there are none here)
    const body = (result.Patient.definitions!.Patient as EditableJSONSchema).allOf![1] as any
    expect(body.properties).toHaveProperty("name")
    expect(body.required).toBeUndefined() // Required array is deleted after filtering
  })

  it("prunes a schema that has absolutely no required properties", () => {
    const schemas: Record<string, EditableJSONSchema> = {
      Observation: mockSchema("Observation", {status: {type: "string"}})
    }

    const result = filterRequiredSchemas(schemas)

    expect(result.Observation).toBeUndefined()
  })

  it("keeps a parent schema if it references a child schema that is required", () => {
    const schemas: Record<string, EditableJSONSchema> = {
      // Parent has no required fields, but references Child
      Parent: mockSchema("Parent", {
        childObject: {$ref: "Child.schema.json"}
      }),
      // Child has a required field
      Child: mockSchema("Child", {
        id: {type: "string"}
      }, ["id"])
    }

    const result = filterRequiredSchemas(schemas)

    // Both should be kept because the parent depends on a child that has required elements
    expect(result.Parent).toBeDefined()
    expect(result.Child).toBeDefined()

    const parentBody = (result.Parent.definitions!.Parent as EditableJSONSchema).allOf![1] as any
    expect(parentBody.properties).toHaveProperty("childObject")
  })

  it("drops schemas with circular references if neither has required properties", () => {
    const schemas: Record<string, EditableJSONSchema> = {
      NodeA: mockSchema("NodeA", {next: {$ref: "NodeB.schema.json"}}),
      NodeB: mockSchema("NodeB", {prev: {$ref: "NodeA.schema.json"}})
    }

    // If infinite loop protection fails, this will timeout/crash
    const result = filterRequiredSchemas(schemas)

    expect(result.NodeA).toBeUndefined()
    expect(result.NodeB).toBeUndefined()
  })

  it("keeps schemas with circular references if at least one path resolves to a required property", () => {
    const schemas: Record<string, EditableJSONSchema> = {
      NodeA: mockSchema("NodeA", {next: {$ref: "NodeB.schema.json"}}),
      NodeB: mockSchema("NodeB", {
        prev: {$ref: "NodeA.schema.json"},
        value: {type: "string"}
      }, ["value"]) // NodeB requires 'value'
    }

    const result = filterRequiredSchemas(schemas)

    expect(result.NodeA).toBeDefined()
    expect(result.NodeB).toBeDefined()
  })

  it("keeps extension properties (_propertyName) if the base propertyName is required", () => {
    const schemas: Record<string, EditableJSONSchema> = {
      Encounter: mockSchema("Encounter", {
        status: {type: "string"},
        _status: {$ref: "Element.schema.json"}, // Extension object
        unrelated: {type: "string"}
      }, ["status"])
    }

    const result = filterRequiredSchemas(schemas)

    expect(result.Encounter).toBeDefined()

    const body = (result.Encounter.definitions!.Encounter as EditableJSONSchema).allOf![1] as any

    // Should keep both the required base property and its extension
    expect(body.properties).toHaveProperty("status")
    expect(body.properties).toHaveProperty("_status")

    // Should prune the unrelated, unrequired property
    expect(body.properties).not.toHaveProperty("unrelated")
  })

  it("resolves local internal definitions references ($ref: '#/definitions/...')", () => {
    const parentSchema = mockSchema("ComplexItem", {
      internalProp: {$ref: "#/definitions/ComplexItem_Internal"}
    }) as EditableJSONSchema

    // Inject the internal sub-definition into the same schema object
    parentSchema.definitions!["ComplexItem_Internal"] = {
      allOf: [
        {$ref: "BackboneElement"},
        {
          properties: {innerValue: {type: "string"}},
          required: ["innerValue"]
        }
      ]
    } as any

    const schemas: Record<string, EditableJSONSchema> = {
      ComplexItem: parentSchema
    }

    const result = filterRequiredSchemas(schemas)

    expect(result.ComplexItem).toBeDefined()
    const parentBody = result.ComplexItem.definitions!.ComplexItem.allOf![1] as any
    expect(parentBody.properties).toHaveProperty("internalProp")
  })
})
