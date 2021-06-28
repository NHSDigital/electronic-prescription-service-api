import {
  convertAddress,
  convertName, convertTelecom,
  generateResourceId,
  getFullUrl
} from "../../../../src/services/translation/response/common"
import {hl7V3} from "@models"

describe("convertName", () => {
  test("converts unstructured name", () => {
    const result = convertName({
      _attributes: {use: hl7V3.NameUse.USUAL},
      _text: "Dr Jane Smith"
    })
    expect(result).toMatchObject([{
      use: "usual",
      text: "Dr Jane Smith"
    }])
  })

  test("converts structured name with multiple given, prefix, suffix", () => {
    const result = convertName({
      _attributes: {use: hl7V3.NameUse.USUAL},
      family: {_text: "Smith"},
      given: [{_text: "Jane"}, {_text: "Michael"}],
      prefix: [{_text: "Prof"}, {_text: "Dr"}],
      suffix: [{_text: "III"}, {_text: "Esq"}]
    })
    expect(result).toMatchObject([{
      use: "usual",
      family: "Smith",
      given: ["Jane", "Michael"],
      prefix: ["Prof", "Dr"],
      suffix: ["III", "Esq"]
    }])
  })

  test("converts structured name with single given, prefix, suffix", () => {
    const result = convertName({
      _attributes: {use: hl7V3.NameUse.ALIAS},
      family: {_text: "Wilson"},
      given: [{_text: "Bob"}],
      prefix: [{_text: "Father"}],
      suffix: [{_text: "Sr"}]
    })
    expect(result).toMatchObject([{
      use: "temp",
      family: "Wilson",
      given: ["Bob"],
      prefix: ["Father"],
      suffix: ["Sr"]
    }])
  })

  test("converts multiple names", () => {
    const result = convertName([
      {
        _attributes: {use: hl7V3.NameUse.USUAL},
        family: {_text: "Smith"},
        given: [{_text: "Jane"}, {_text: "Michael"}],
        prefix: [{_text: "Prof"}, {_text: "Dr"}],
        suffix: [{_text: "III"}, {_text: "Esq"}]
      },
      {
        _attributes: {use: hl7V3.NameUse.ALIAS},
        family: {_text: "Wilson"},
        given: [{_text: "Bob"}],
        prefix: [{_text: "Father"}],
        suffix: [{_text: "Sr"}]
      }
    ])
    expect(result).toMatchObject([
      {
        use: "usual",
        family: "Smith",
        given: ["Jane", "Michael"],
        prefix: ["Prof", "Dr"],
        suffix: ["III", "Esq"]
      },
      {
        use: "temp",
        family: "Wilson",
        given: ["Bob"],
        prefix: ["Father"],
        suffix: ["Sr"]
      }
    ])
  })

  const unstructuredNameAllFields = {
    _attributes: {use: hl7V3.NameUse.USUAL},
    _text: "Dr Jane Smith"
  }
  test.each(Object.keys(unstructuredNameAllFields))(
    "handles unstructured name without %s key",
    (key: keyof typeof unstructuredNameAllFields) => {
      const nameShallowCopy = {...unstructuredNameAllFields}
      delete nameShallowCopy[key]
      expect(() => convertName(nameShallowCopy)).not.toThrow()
    }
  )

  const structuredNameAllFields = {
    _attributes: {use: hl7V3.NameUse.USUAL},
    family: {_text: "Smith"},
    given: [{_text: "Jane"}, {_text: "Michael"}],
    prefix: [{_text: "Prof"}, {_text: "Dr"}],
    suffix: [{_text: "III"}, {_text: "Esq"}]
  }
  test.each(Object.keys(structuredNameAllFields))(
    "handles structured name without %s key",
    (key: keyof typeof structuredNameAllFields) => {
      const nameShallowCopy = {...structuredNameAllFields}
      delete nameShallowCopy[key]
      expect(() => convertName(nameShallowCopy)).not.toThrow()
    }
  )
})

describe("convertAddress", () => {
  test("converts unstructured address", () => {
    const result = convertAddress({
      _attributes: {use: hl7V3.AddressUse.HOME},
      _text: "1 Abbey Rd, Kirkstall, Leeds, LS5 3EH"
    })
    expect(result).toMatchObject([{
      use: "home",
      text: "1 Abbey Rd, Kirkstall, Leeds, LS5 3EH"
    }])
  })

  test("converts single address with multiple streetAddressLine", () => {
    const result = convertAddress({
      _attributes: {use: hl7V3.AddressUse.HOME},
      streetAddressLine: [{_text: "1 Abbey Rd"}, {_text: "Kirkstall"}, {_text: "Leeds"}],
      postalCode: {_text: "LS5 3EH"}
    })
    expect(result).toMatchObject([{
      use: "home",
      line: ["1 Abbey Rd", "Kirkstall", "Leeds"],
      postalCode: "LS5 3EH"
    }])
  })

  test("converts single address with single streetAddressLine", () => {
    const result = convertAddress({
      _attributes: {use: hl7V3.AddressUse.WORK},
      streetAddressLine: [{_text: "141 Beckett St"}],
      postalCode: {_text: "LS9 7LN"}
    })
    expect(result).toMatchObject([{
      use: "work",
      line: ["141 Beckett St"],
      postalCode: "LS9 7LN"
    }])
  })

  test("converts multiple addresses", () => {
    const result = convertAddress([
      {
        _attributes: {use: hl7V3.AddressUse.HOME},
        streetAddressLine: [{_text: "1 Abbey Rd"}, {_text: "Kirkstall"}, {_text: "Leeds"}],
        postalCode: {_text: "LS5 3EH"}
      },
      {
        _attributes: {use: hl7V3.AddressUse.WORK},
        streetAddressLine: [{_text: "141 Beckett St"}],
        postalCode: {_text: "LS9 7LN"}
      }
    ])
    expect(result).toMatchObject([
      {
        use: "home",
        line: ["1 Abbey Rd", "Kirkstall", "Leeds"],
        postalCode: "LS5 3EH"
      },
      {
        use: "work",
        line: ["141 Beckett St"],
        postalCode: "LS9 7LN"
      }
    ])
  })

  const unstructuredAddressAllFields = {
    _attributes: {use: hl7V3.AddressUse.HOME},
    _text: "1 Abbey Rd, Kirkstall, Leeds, LS5 3EH"
  }
  test.each(Object.keys(unstructuredAddressAllFields))(
    "handles unstructured address without %s key",
    (key: keyof typeof unstructuredAddressAllFields) => {
      const addressShallowCopy = {...unstructuredAddressAllFields}
      delete addressShallowCopy[key]
      expect(() => convertAddress(addressShallowCopy)).not.toThrow()
    }
  )

  const structuredAddressAllFields = {
    _attributes: {use: hl7V3.AddressUse.HOME},
    streetAddressLine: [{_text: "1 Abbey Rd"}, {_text: "Kirkstall"}, {_text: "Leeds"}],
    postalCode: {_text: "LS5 3EH"}
  }
  test.each(Object.keys(structuredAddressAllFields))(
    "handles structured address without %s key",
    (key: keyof typeof structuredAddressAllFields) => {
      const addressShallowCopy = {...structuredAddressAllFields}
      delete addressShallowCopy[key]
      expect(() => convertAddress(addressShallowCopy)).not.toThrow()
    }
  )
})

describe("convertTelecom", () => {
  test("converts single telecom with single colon", () => {
    const result = convertTelecom({
      _attributes: {
        use: hl7V3.TelecomUse.HOME,
        value: "tel:123412341234"
      }
    })
    expect(result).toMatchObject([{
      use: "home",
      value: "123412341234"
    }])
  })

  test("converts single telecom with multiple colons", () => {
    const result = convertTelecom({
      _attributes: {
        use: hl7V3.TelecomUse.HOME,
        value: "tel:123412341234:1"
      }
    })
    expect(result).toMatchObject([{
      use: "home",
      value: "123412341234:1"
    }])
  })

  test("converts single telecom without colon", () => {
    const result = convertTelecom({
      _attributes: {
        use: hl7V3.TelecomUse.HOME,
        value: "123412341234"
      }
    })
    expect(result).toMatchObject([{
      use: "home",
      value: "123412341234"
    }])
  })

  const telecomAllFields = {
    _attributes: {
      use: hl7V3.TelecomUse.HOME,
      value: "123412341234"
    }
  }
  test.each(Object.keys(telecomAllFields._attributes))(
    "handles telecom without %s attribute",
    (attributeKey: keyof typeof telecomAllFields._attributes) => {
      const attributesShallowCopy = {...telecomAllFields._attributes}
      delete attributesShallowCopy[attributeKey]
      expect(() => convertTelecom({_attributes: attributesShallowCopy}))
    }
  )
})

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
