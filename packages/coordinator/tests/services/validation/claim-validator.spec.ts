import {fetcher} from "@models"
import {verifyClaim} from "../../../src/services/validation/claim-validator"
import {DISPENSING_USER_SCOPE} from "../../../src/services/validation/scope-validator"
import pino from "pino"

const logger = pino()
const loggerWarnSpy = jest.spyOn(logger, "warn")

describe("verifyClaim", () => {
  const invalidClaim = fetcher.claimExamples[0].request
  const validClaim = fetcher.claimExamples[1].request

  test("accepts a valid Claim", () => {
    const result = verifyClaim(validClaim, DISPENSING_USER_SCOPE, "test_sds_user_id", "test_sds_role_id", logger)
    expect(result).toHaveLength(0)
  })

  test("logger warn when inconsistent accessToken and body SDS user unique ID", () => {
    verifyClaim(validClaim, DISPENSING_USER_SCOPE, "test_sds_user_id", "555086415105", logger)
    expect(loggerWarnSpy).toHaveBeenCalledWith({
      accessTokenSDSUserID: "test_sds_user_id",
      bodySDSUserID: "7654321"
    },
    "SDS Unique User ID does not match between access token and message body"
    )
  })

  test("console warn when inconsistent accessToken and body SDS role profile ID", () => {
    verifyClaim(validClaim, DISPENSING_USER_SCOPE, "3415870201", "test_sds_role_id", logger)
    expect(loggerWarnSpy).toHaveBeenCalledWith({
      accessTokenSDSRoleID: "test_sds_role_id",
      bodySDSRoleID: "454567759542"
    },
    "SDS Role ID does not match between access token and message body"
    )
  })

  test("raise an error if no endorsement code is provided in the claim", () => {
    const result = verifyClaim(invalidClaim, DISPENSING_USER_SCOPE, "test_sds_user_id", "test_sds_role_id", logger)
    expect(result[0].diagnostics).toEqual("The claim is missing the required endorsement code.")
  })

  test("accepts a claim against NHS BSA (T1450)", () => {
    const claim = {...validClaim}
    claim.insurance[0].coverage = coverageWithValue("T1450")

    const result = verifyClaim(claim, DISPENSING_USER_SCOPE, "test_sds_user_id", "test_sds_role_id", logger)
    expect(result).toHaveLength(0)
  })

  test("accepts a claim against NWSSP (RQFZ1)", () => {
    const claim = {...validClaim}
    claim.insurance[0].coverage = coverageWithValue("RQFZ1")

    const result = verifyClaim(claim, DISPENSING_USER_SCOPE, "test_sds_user_id", "test_sds_role_id", logger)
    expect(result).toHaveLength(0)
  })

  test("raise an error if the claim is not against NHS BSA or NWSSP", () => {
    const claim = {...validClaim}
    claim.insurance[0].coverage = coverageWithValue("invalid")

    const result = verifyClaim(claim, DISPENSING_USER_SCOPE, "test_sds_user_id", "test_sds_role_id", logger)
    expect(result[0]).toEqual({
      severity: "error",
      code: "value",
      diagnostics: "Claim.insurance[0].coverage.identifier.value must be one of: 'T1450', 'RQFZ1'.",
      expression: ["Claim.insurance[0].coverage.identifier.value"]
    })
  })

  test("raise an error if no insurance is provided in the claim", () => {
    const claim = {...validClaim}
    claim.insurance = []

    const result = verifyClaim(claim, DISPENSING_USER_SCOPE, "test_sds_user_id", "test_sds_role_id", logger)
    expect(result[0]).toEqual(arrayLengthError(0))
  })

  test("raise an error if more than one insurance is provided in the claim", () => {
    const claim = {...validClaim}
    claim.insurance = [claim.insurance[0], claim.insurance[0]]

    const result = verifyClaim(claim, DISPENSING_USER_SCOPE, "test_sds_user_id", "test_sds_role_id", logger)
    expect(result[0]).toEqual(arrayLengthError(2))
  })

  test("raise an error if BSA ODS is lowercase", () => {
    const claim = {...validClaim}
    claim.insurance[0].coverage = coverageWithValue("t1450")

    const result = verifyClaim(claim, DISPENSING_USER_SCOPE, "test_sds_user_id", "test_sds_role_id", logger)
    expect(result[0]).toEqual({
      severity: "error",
      code: "value",
      diagnostics: "Claim.insurance[0].coverage.identifier.value must be one of: 'T1450', 'RQFZ1'.",
      expression: ["Claim.insurance[0].coverage.identifier.value"]
    })
  })

  test("raise an error if NWSSP ODS is lowercase", () => {
    const claim = {...validClaim}
    claim.insurance[0].coverage = coverageWithValue("rqfz1")

    const result = verifyClaim(claim, DISPENSING_USER_SCOPE, "test_sds_user_id", "test_sds_role_id", logger)
    expect(result[0]).toEqual({
      severity: "error",
      code: "value",
      diagnostics: "Claim.insurance[0].coverage.identifier.value must be one of: 'T1450', 'RQFZ1'.",
      expression: ["Claim.insurance[0].coverage.identifier.value"]
    })
  })
})

const arrayLengthError = (length: number) => ({
  severity: "error",
  code: "invalid",
  diagnostics: `Expected 1 item(s) in Claim.insurance, but received ${length}.`
})

const coverageWithValue = (value: string) => ({
  identifier: {
    system: "https://fhir.nhs.uk/Id/ods-organization-code",
    value: value
  }
})
