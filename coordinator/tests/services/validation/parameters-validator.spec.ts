import {fhir, validationErrors as errors} from "@models"
import * as TestResources from "../../resources/test-resources"
import {verifyParameters} from "../../../src/services/validation/parameters-validator"
import {
  DISPENSING_APP_SCOPE,
  DISPENSING_USER_SCOPE,
  PRESCRIBING_APP_SCOPE,
  PRESCRIBING_USER_SCOPE
} from "../../../src/services/validation/scope-validator"

jest.spyOn(global.console, "warn").mockImplementation(() => null)

describe("verifyParameters returns errors", () => {
  const validParameters = TestResources.exampleParameters
  const bodyOdsCode = "VNFKT"

  afterEach(() => {
    process.env.DISPENSE_ENABLED = "true"
  })

  test('rejects when resourceType not "Parameters"', () => {
    const invalidParameters = {...validParameters, resourceType: "bluh"}
    const returnedErrors = verifyParameters(invalidParameters as fhir.Parameters, DISPENSING_APP_SCOPE, bodyOdsCode)
    expect(returnedErrors).toEqual([errors.createResourceTypeIssue("Parameters")])
  })

  test("verifyParameters rejects a message when dispensing is disabled", () => {
    process.env.DISPENSE_ENABLED = "false"
    const result = verifyParameters(validParameters, DISPENSING_APP_SCOPE, bodyOdsCode)
    expect(result).toEqual([errors.createDisabledFeatureIssue("Dispensing")])
  })

  test("rejects when only prescribing user scope present", () => {
    const result = verifyParameters(validParameters, PRESCRIBING_USER_SCOPE, bodyOdsCode)
    expect(result).toEqual([errors.createMissingScopeIssue("Dispensing")])
  })

  test("rejects when only prescribing app scope present", () => {
    const result = verifyParameters(validParameters, PRESCRIBING_APP_SCOPE, bodyOdsCode)
    expect(result).toEqual([errors.createMissingScopeIssue("Dispensing")])
  })

  test("accepts when only dispensing user scope present", () => {
    const result = verifyParameters(validParameters, DISPENSING_USER_SCOPE, bodyOdsCode)
    expect(result).toEqual([])
  })

  test("accepts when only dispensing app scope present", () => {
    const result = verifyParameters(validParameters, DISPENSING_APP_SCOPE, bodyOdsCode)
    expect(result).toEqual([])
  })

  test("console warn when inconsistent accessToken and body ods codes", () => {
    const invalidParameters: fhir.Parameters = {
      resourceType: "Parameters",
      parameter: [{name: "owner", valueIdentifier: {system: "", value: "test_ods_code"}}]
    }
    verifyParameters(invalidParameters, DISPENSING_APP_SCOPE, bodyOdsCode)
    expect(console.warn).toHaveBeenCalled()
  })
})
