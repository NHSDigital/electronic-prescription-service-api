import {fhir, fetcher} from "@models"
import {verifyClaim} from "../../../src/services/validation/claim-validator"
import {DISPENSING_USER_SCOPE} from "../../../src/services/validation/scope-validator"

jest.spyOn(global.console, "warn").mockImplementation(() => null)

describe("verifyClaim", () => {
  const validClaim = fetcher.claimExamples[0].request
  const bodyOdsCode = validClaim.payee.party.identifier.value

  test("accepts a valid Claim", () => {
    const result = verifyClaim(validClaim, DISPENSING_USER_SCOPE, bodyOdsCode)
    expect(result).toHaveLength(0)
  })

  test("console warn when inconsistent accessToken and body ods codes", () => {
    const payee: fhir.ClaimPayee = {
      party: {
        identifier: {
          system: "test_system",
          value: "test_ods_code"
        }
      }
    }
    const invalidClaim: fhir.Claim = {...validClaim, payee}
    verifyClaim(invalidClaim, DISPENSING_USER_SCOPE, bodyOdsCode)
    expect(console.warn).toHaveBeenCalled()
  })
})
