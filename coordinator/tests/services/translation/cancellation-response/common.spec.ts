import {convertName} from "../../../../src/services/translation/cancellation/common"

describe("convertNameUse", () => {
  test("doesn't display a use key if no use passed in", () => {
    const actual = convertName({
      _attributes: {},
      prefix: [{_text: "prefix"}],
      given: {_text: "given"},
      family: {_text: "last"}
    })
    expect(actual).toEqual([{"family": "last", "given": ["given"], "prefix": ["prefix"]}])
  })
})
