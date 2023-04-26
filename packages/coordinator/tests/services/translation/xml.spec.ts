import {
  readXml,
  readXmlStripNamespace,
  writeXmlStringCanonicalized,
  writeXmlStringPretty
} from "../../../src/services/serialisation/xml"
import * as TestResources from "../../resources/test-resources"

describe("writeXmlStringCanonicalized canonicalizes XML correctly", () => {
  test("writeXmlStringCanonicalized returns correct value", async () => {
    const fragments = TestResources.specification[0].hl7V3SignatureFragments
    const actualOutput = await writeXmlStringCanonicalized(fragments, "http://www.w3.org/2001/10/xml-exc-c14n#")
    const expectedOutput = TestResources.specification[0].hl7V3FragmentsCanonicalized
    expect(actualOutput).toEqual(expectedOutput)
  })

  //TODO - add more tests to prove that XML is correctly canonicalized
})

describe("writeXml escapes XML chars in attributes", () => {
  test("writeXml escapes ampersand in attributes", async () => {
    const tag = {
      tag: {
        _attributes: {
          attr: "test&test"
        }
      }
    }
    const canonicalized = await writeXmlStringCanonicalized(tag, "http://www.w3.org/2001/10/xml-exc-c14n#")
    expect(writeXmlStringPretty(tag)).toEqual('<tag attr="test&amp;test"/>')
    expect(canonicalized).toEqual('<tag attr="test&amp;test"></tag>')
  })

  test("writeXml escapes less than in attributes", async () => {
    const tag = {
      tag: {
        _attributes: {
          attr: "test<test"
        }
      }
    }
    const canonicalized = await writeXmlStringCanonicalized(tag, "http://www.w3.org/2001/10/xml-exc-c14n#")
    expect(writeXmlStringPretty(tag)).toEqual('<tag attr="test&lt;test"/>')
    expect(canonicalized).toEqual('<tag attr="test&lt;test"></tag>')
  })

  test("writeXml escapes greater than in attributes", async () => {
    const tag = {
      tag: {
        _attributes: {
          attr: "test>test"
        }
      }
    }

    const canonicalized = await writeXmlStringCanonicalized(tag, "http://www.w3.org/2001/10/xml-exc-c14n#")
    expect(writeXmlStringPretty(tag)).toEqual('<tag attr="test&gt;test"/>')
    expect(canonicalized).toEqual('<tag attr="test>test"></tag>')
  })

  test("writeXml escapes double quote in attributes", async () => {
    const tag = {
      tag: {
        _attributes: {
          attr: 'test"test'
        }
      }
    }
    const canonicalized = await writeXmlStringCanonicalized(tag, "http://www.w3.org/2001/10/xml-exc-c14n#")
    expect(writeXmlStringPretty(tag)).toEqual('<tag attr="test&quot;test"/>')
    expect(canonicalized).toEqual('<tag attr="test&quot;test"></tag>')
  })

  test("writeXml escapes single quote in attributes", async () => {
    const tag = {
      tag: {
        _attributes: {
          attr: "test'test"
        }
      }
    }
    const canonicalized = await writeXmlStringCanonicalized(tag, "http://www.w3.org/2001/10/xml-exc-c14n#")
    expect(writeXmlStringPretty(tag)).toEqual('<tag attr="test&#39;test"/>')
    expect(canonicalized).toEqual('<tag attr="test\'test"></tag>')
  })

  test("writeXml escapes the ampersand in the string &quot; in attributes", async () => {
    const tag = {
      tag: {
        _attributes: {
          attr: "test&quot;test"
        }
      }
    }
    const canonicalized = await writeXmlStringCanonicalized(tag, "http://www.w3.org/2001/10/xml-exc-c14n#")
    expect(writeXmlStringPretty(tag)).toEqual('<tag attr="test&amp;quot;test"/>')
    expect(canonicalized).toEqual('<tag attr="test&amp;quot;test"></tag>')
  })

  test("writeXml handles undefined attributes", async () => {
    const tag = {
      tag: {
        _attributes: {
          attr: undefined as string
        }
      }
    }
    const canonicalized = await writeXmlStringCanonicalized(tag, "http://www.w3.org/2001/10/xml-exc-c14n#")
    expect(writeXmlStringPretty(tag)).toEqual("<tag/>")
    expect(canonicalized).toEqual("<tag></tag>")
  })
})

describe("readXml handles namespaces correctly", () => {
  const xmlWithNamespace = '<ns:tag attr="test"/>'
  const xmlWithoutNamespace = '<tag attr="test"/>'
  const jsWithNamespace = {
    "ns:tag": {
      _attributes: {
        attr: "test"
      }
    }
  }
  const jsWithoutNamespace = {
    tag: {
      _attributes: {
        attr: "test"
      }
    }
  }

  test("readXmlStripNamespace removes namespace from XML tags when present", () => {
    const tag = readXmlStripNamespace(xmlWithNamespace)
    expect(tag).toEqual(jsWithoutNamespace)
  })

  test("readXmlStripNamespace does not modify tag names when namespace is not present", () => {
    const tag = readXmlStripNamespace(xmlWithoutNamespace)
    expect(tag).toEqual(jsWithoutNamespace)
  })

  test("readXml preserves namespaces in XML tags when present", () => {
    const tag = readXml(xmlWithNamespace)
    expect(tag).toEqual(jsWithNamespace)
  })

  test("readXml does not modify tag names when namespace is not present", () => {
    const tag = readXml(xmlWithoutNamespace)
    expect(tag).toEqual(jsWithoutNamespace)
  })
})

describe("converts streetAddressLine to array correctly", () => {
  const xmlWithSingleAddressLine =
    "<addr><streetAddressLine>SALTERS LANE</streetAddressLine><postalCode>TS21 3EE</postalCode></addr>"
  const xmlWithMultipleAddressLine = `<addr>
    <streetAddressLine>SALTERS LANE</streetAddressLine>
    <streetAddressLine>Another Line</streetAddressLine>
    <postalCode>TS21 3EE</postalCode>
  </addr>`
  const jsWithSingleAddressLine = {
    addr: {
      streetAddressLine: [
        {
          _text: "SALTERS LANE"
        }
      ],
      postalCode: {
        _text: "TS21 3EE"
      }
    }
  }
  const jsWithMultipleAddressLine = {
    addr: {
      streetAddressLine: [
        {
          _text: "SALTERS LANE"
        },
        {
          _text: "Another Line"
        }
      ],
      postalCode: {
        _text: "TS21 3EE"
      }
    }
  }

  test("readXmlStripNamespace returns array of streetAddressLine when one address line present", () => {
    const result = readXmlStripNamespace(xmlWithSingleAddressLine)
    expect(result).toEqual(jsWithSingleAddressLine)
  })

  test("readXmlStripNamespace returns array of streetAddressLine when multiple address line present", () => {
    const result = readXmlStripNamespace(xmlWithMultipleAddressLine)
    expect(result).toEqual(jsWithMultipleAddressLine)
  })
})
