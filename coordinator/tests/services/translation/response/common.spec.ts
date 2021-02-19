import {convertName, generateResourceId, getFullUrl} from "../../../../src/services/translation/response/common"

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

describe("resourceId", () => {
  const UUID_REGEX = /[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/
  test("generate", () => {
    const resourceId = generateResourceId()
    expect(UUID_REGEX.test(resourceId)).toBeTruthy()
  })

  test("getFullUrl", () => {
    const resourceId = generateResourceId()
    const fullUrl = getFullUrl(resourceId)
    expect(fullUrl).toBe(`urn:uuid:${resourceId}`)
  })
})
