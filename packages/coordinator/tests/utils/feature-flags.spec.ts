import {isSignatureValidationEnabled} from "../../src/utils/feature-flags"

describe("feature-flags", () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = {...originalEnv}
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe("isSignatureValidationEnabled", () => {
    test.each([
      ["true", true],
      ["false", false],
      [undefined, false],
      ["random-value", false]
    ])(
      "ENABLE_PRESCRIBING_SIGNATURE_VALIDATION is %p, returns %p",
      (enabled: string | undefined, expectedValue: boolean) => {
        if (enabled !== undefined) {
          process.env.ENABLE_PRESCRIBING_SIGNATURE_VALIDATION = enabled
        } else {
          delete process.env.ENABLE_PRESCRIBING_SIGNATURE_VALIDATION
        }

        expect(isSignatureValidationEnabled()).toBe(expectedValue)
      }
    )
  })
})
