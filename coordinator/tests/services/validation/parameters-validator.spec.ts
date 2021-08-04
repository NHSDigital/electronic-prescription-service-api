import {fhir, validationErrors as errors} from "@models"
import * as TestResources from "../../resources/test-resources"
import {verifyParameters} from "../../../src/services/validation/parameters-validator"
import {
  dispensingAppScope,
  dispensingUserScope,
  prescribingAppScope,
  prescribingUserScope
} from "../../../tests/services/validation/scopes"

describe("verifyParameters returns errors", () => {
  const validParameters = TestResources.exampleParameters

  afterEach(() => {
    process.env.DISPENSE_ENABLED = "true"
  })

  test('rejects when resourceType not "Parameters"', () => {
    const invalidParameters = {...validParameters, resourceType: "bluh"}
    const returnedErrors = verifyParameters(invalidParameters as fhir.Parameters, dispensingAppScope)
    expect(returnedErrors).toEqual([errors.createResourceTypeIssue("Parameters")])
  })

  test("verifyParameters rejects a message when dispensing is disabled", () => {
    process.env.DISPENSE_ENABLED = "false"
    const result = verifyParameters(validParameters, dispensingAppScope)
    expect(result).toEqual([errors.createDisabledFeatureIssue("Dispensing")])
  })

  test("rejects when only prescribing user scope present", () => {
    const result = verifyParameters(validParameters, prescribingUserScope)
    expect(result).toEqual([errors.incorrectScopeIssue])
  })

  test("rejects when only prescribing app scope present", () => {
    const result = verifyParameters(validParameters, prescribingAppScope)
    expect(result).toEqual([errors.incorrectScopeIssue])
  })

  test("accepts when only dispensing user scope present", () => {
    const result = verifyParameters(validParameters, dispensingUserScope)
    expect(result).toEqual([])
  })

  test("accepts when only dispensing app scope present", () => {
    const result = verifyParameters(validParameters, dispensingAppScope)
    expect(result).toEqual([])
  })
})
