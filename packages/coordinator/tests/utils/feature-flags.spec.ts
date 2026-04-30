import {isSignatureValidationEnabled} from "../../src/utils/feature-flags"

describe("feature-flags", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
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
        if (enabled === undefined) {
          delete process.env.ENABLE_PRESCRIBING_SIGNATURE_VALIDATION
        } else {
          process.env.ENABLE_PRESCRIBING_SIGNATURE_VALIDATION = enabled
        }

        expect(isSignatureValidationEnabled()).toBe(expectedValue)
      }
    )
  })
})
