import {fhir, validationErrors as errors} from "@models"
import * as TestResources from "../../resources/test-resources"
import {verifyParameters} from "../../../src/services/validation/parameters-validator"

describe("verifyParameters returns errors", () => {
  const validParameters = TestResources.exampleParameters

  afterEach(() => {
    process.env.DISPENSE_ENABLED = "true"
  })

  test("verifyParameters rejects a message when dispensing is disabled",
    () => {
      process.env.DISPENSE_ENABLED = "false"
      expect(verifyParameters(validParameters)).toEqual([errors.functionalityDisabled])
    })

  test('rejects when resourceType not "Parameters"', () => {
    const invalidParameters = {...validParameters, resourceType: "bluh"}
    const returnedErrors = verifyParameters(invalidParameters as fhir.Parameters)
    expect(returnedErrors).toEqual([errors.createResourceTypeIssue("Parameters")])
  })
})
