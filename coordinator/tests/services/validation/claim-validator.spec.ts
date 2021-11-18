import {fhir, fetcher, validationErrors as errors} from "@models"
import {verifyClaim} from "../../../src/services/validation/claim-validator"
import {DISPENSING_USER_SCOPE} from "../../../src/services/validation/scope-validator"

describe("verifyClaim", () => {
  const validClaim = fetcher.claimExamples[0].request
  const bodyOdsCode = validClaim.payee.party.identifier.value

  test("accepts a valid Claim", () => {
    const result = verifyClaim(validClaim, DISPENSING_USER_SCOPE, bodyOdsCode)
    expect(result).toHaveLength(0)
  })

  test("rejects a Claim with inconsistent accessToken and body ods codes", () => {
    const payee: fhir.ClaimPayee = {
      party: {
        identifier: {
          system: "test_system",
          value: "test_ods_code"
        }
      }
    }
    const invalidClaim: fhir.Claim = {...validClaim, payee}
    const result = verifyClaim(invalidClaim, DISPENSING_USER_SCOPE, bodyOdsCode)
    expect(result).toContainEqual(
      errors.createInconsistentOrganizationIssue("claim.payee.party", bodyOdsCode, "test_ods_code")
    )
  })
})
