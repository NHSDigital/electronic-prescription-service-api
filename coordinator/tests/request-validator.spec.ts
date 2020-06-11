import rewire from "rewire";

const validator = rewire("../dist/validators/request-validator.js")

test('verifyBundleContainsEntries returns true for bundle with entries', () => {

    const verify = validator.__get__("verifyBundleContainsEntries")

    const testJSON = {entry: "here"}
    expect(verify(testJSON)).toBe(true)
})
