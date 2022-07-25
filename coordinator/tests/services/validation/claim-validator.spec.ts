import {fetcher} from "@models"
import {verifyClaim} from "../../../src/services/validation/claim-validator"
import {DISPENSING_USER_SCOPE} from "../../../src/services/validation/scope-validator"

jest.spyOn(global.console, "warn").mockImplementation(() => null)

describe("verifyClaim", () => {
  const validClaim = fetcher.claimExamples[0].request

  test("accepts a valid Claim", () => {
    const result = verifyClaim(validClaim, DISPENSING_USER_SCOPE)
    expect(result).toHaveLength(0)
  })

})
