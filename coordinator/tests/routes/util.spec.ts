import {asOperationOutcome} from "../../src/routes/util"

describe("asOperationOutcome", () => {
  const operationOutcome = {
    resourceType: "OperationOutcome",
    issue: [{
      severity: "fatal",
      code: "invalid",
      details: {
        coding: [{
          system: "system",
          version: "version",
          code: "code",
          display: "display"
        }]
      }
    }]
  }

  test("returns input if body is already an OperationOutcome", () => {
    const result = asOperationOutcome({
      statusCode: 400,
      body: operationOutcome
    })
    expect(result).toBe(operationOutcome)
  })

  test("returns OperationOutcome if body is a string", () => {
    const result = asOperationOutcome({
      statusCode: 400,
      body: "Something went terribly wrong"
    })
    expect(result).toEqual({
      resourceType: "OperationOutcome",
      issue: [{
        severity: "error",
        code: "invalid",
        diagnostics: "Something went terribly wrong"
      }]
    })
  })
})
